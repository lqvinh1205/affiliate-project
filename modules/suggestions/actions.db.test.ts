import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AI_UNAVAILABLE } from "@/platform/ai/ask";
import { fakeAi } from "@/platform/ai/providers/fake";
import { ProviderError, type ProviderRequest } from "@/platform/ai/providers/types";
import { db } from "@/platform/db";
import { actionTest, resetTestDb, runAfterCallbacks } from "@/vitest.db.helpers";
import { approveSuggestion, rejectSuggestion, researchProduct } from "@/modules/suggestions/actions";
import { getProductSuggestionsForCms } from "@/modules/suggestions/cms-queries";
import { CATEGORY_NOT_PICKED, GENERATING_STALE, RESEARCH_FAILED } from "@/modules/suggestions/constants";

let categoryId: string;

async function product(data: { rawReviews?: string | null; image?: string | null; rawImageUrls?: string[] } = {}) {
  return db.product.create({
    data: {
      name: "Nồi chiên không dầu",
      affiliateUrl: "https://s.shopee.vn/abc",
      rawText: "Dung tích 5L",
      rawReviews: "rawReviews" in data ? data.rawReviews : "Nấu nhanh, hơi ồn",
      image: data.image ?? null,
      rawImageUrls: data.rawImageUrls ?? [],
    },
  });
}

// Câu trả lời AI giả lập đúng schema (có `sources` vì nghiên cứu luôn bật tìm web).
function aiReply(patch: { categoryId?: string | null; sources?: { url: string; title: string }[] } = {}) {
  return (req: ProviderRequest) => ({
    data: {
      info: [{ text: "Rửa được bằng máy", sourceUrl: "https://example.com/noi" }],
      infoNote: null,
      imageDescription: req.images.length > 0 ? "Nồi màu kem" : null,
      reviewSummary: { praise: ["Nấu nhanh"], complaints: ["Hơi ồn"], fit: ["Nhà nhỏ"] },
      audiences: [{ name: "Sinh viên", reason: "Bếp nhỏ" }],
      angles: [
        { name: "Tiết kiệm", hook: "Một nồi nấu cả tuần" },
        { name: "Gọn", hook: "Bếp nhỏ vẫn đủ" },
        { name: "Nhanh", hook: "Mười phút có cơm" },
      ],
      category: { categoryId: "categoryId" in patch ? patch.categoryId : categoryId, reason: "Đồ nấu ăn" },
    },
    sources: patch.sources ?? [{ url: "https://example.com/noi", title: "Bài review" }],
  });
}

async function suggestions(productId: string) {
  return db.suggestion.findMany({ where: { productId }, orderBy: [{ createdAt: "asc" }, { kind: "asc" }] });
}

async function researched(p: { id: string }, reply = aiReply()) {
  fakeAi.reply(reply);
  const res = await researchProduct({ productId: p.id });
  expect(res.ok).toBe(true);
  await runAfterCallbacks();
  return getProductSuggestionsForCms(p.id);
}

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
  categoryId = (await db.category.create({ data: { name: "Nhà bếp", slug: "nha-bep" } })).id;
});

afterAll(() => db.$disconnect());

describe("researchProduct", () => {
  it("ghi RESEARCH + PRODUCT_CATEGORY ở GENERATING, trả ngay, chưa gọi AI cho tới after()", async () => {
    const p = await product();
    fakeAi.reply(aiReply());
    const res = await researchProduct({ productId: p.id });
    expect(res.ok).toBe(true);
    const rows = await suggestions(p.id);
    expect(rows.map((r) => [r.kind, r.status])).toEqual([
      ["RESEARCH", "GENERATING"],
      ["PRODUCT_CATEGORY", "GENERATING"],
    ]);
    expect(rows.every((r) => r.promptId === "research.product" && r.promptVersion === 2)).toBe(true);
    expect(fakeAi.calls()).toHaveLength(0);
    expect(actionTest.updatedTags).toEqual([]);
    const view = await getProductSuggestionsForCms(p.id);
    expect(view.research?.status).toBe("GENERATING");
  });

  it("AI xong: hai gợi ý PENDING, payload đủ khu, nguồn và skipped; một lần gọi AI có tìm web", async () => {
    const p = await product({ image: "https://cf.shopee.vn/a.jpg" });
    const view = await researched(p);
    expect(fakeAi.calls()).toHaveLength(1);
    expect(fakeAi.calls()[0]).toMatchObject({ webSearch: true, images: ["https://cf.shopee.vn/a.jpg"], profile: "quality" });
    expect(view.research).toMatchObject({
      status: "PENDING",
      sources: [{ url: "https://example.com/noi", title: "Bài review" }],
      skipped: [],
      payload: {
        imageDescription: "Nồi màu kem",
        reviewSummary: { praise: ["Nấu nhanh"], complaints: ["Hơi ồn"], fit: ["Nhà nhỏ"] },
        audiences: [{ id: "doc-gia-1", name: "Sinh viên", reason: "Bếp nhỏ" }],
      },
    });
    expect(view.research?.payload?.angles).toHaveLength(3);
    expect(view.category).toMatchObject({
      status: "PENDING",
      payload: { categoryId, categoryName: "Nhà bếp", reason: "Đồ nấu ăn" },
    });
    // after() chỉ ghi Suggestion (CMS, không cache) — không updateTag (AD-18).
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("không có đánh giá dán vào thì hồ sơ không có Khen/Chê/Phù hợp (FR-8)", async () => {
    const view = await researched(await product({ rawReviews: null }));
    expect(view.research?.payload?.reviewSummary).toBeNull();
  });

  it("nhà cung cấp không đọc ảnh, không tìm được nguồn: skipped ghi lại, hồ sơ vẫn PENDING (FR-6, FR-7)", async () => {
    fakeAi.supports({ images: false });
    const p = await product({ image: "https://cf.shopee.vn/a.jpg" });
    const view = await researched(p, aiReply({ sources: [] }));
    expect(view.research).toMatchObject({ status: "PENDING", skipped: ["images", "webSearch"], sources: [] });
    expect(view.research?.payload?.imageDescription).toBeNull();
  });

  it("AI chọn Danh mục không có sẵn: Danh mục gợi ý FAILED, hồ sơ vẫn PENDING (FR-11)", async () => {
    const view = await researched(await product(), aiReply({ categoryId: "khong-ton-tai" }));
    expect(view.research?.status).toBe("PENDING");
    expect(view.category).toMatchObject({ status: "FAILED", errorMessage: CATEGORY_NOT_PICKED });
  });

  it("mọi nhà AI lỗi: hai gợi ý FAILED kèm thông báo tiếng Việt, Sản phẩm không đổi", async () => {
    const p = await product();
    fakeAi.reply(() => {
      throw new ProviderError("quota", "hết hạn mức");
    });
    await researchProduct({ productId: p.id });
    await runAfterCallbacks();
    const view = await getProductSuggestionsForCms(p.id);
    expect(view.research).toMatchObject({ status: "FAILED", errorMessage: `Chưa nghiên cứu được Sản phẩm. ${AI_UNAVAILABLE}` });
    expect(view.category?.status).toBe("FAILED");
    expect(await db.product.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({ name: p.name, categoryId: null });
  });

  it("lỗi bất ngờ trong after(): ghi FAILED thông báo chung rồi ném tiếp để Next ghi log", async () => {
    const p = await product();
    fakeAi.reply(() => {
      throw new TypeError("lỗi lập trình");
    });
    await researchProduct({ productId: p.id });
    await expect(runAfterCallbacks()).rejects.toBeInstanceOf(TypeError);
    const view = await getProductSuggestionsForCms(p.id);
    expect(view.research).toMatchObject({ status: "FAILED", errorMessage: RESEARCH_FAILED });
  });

  it("đang nghiên cứu (chưa quá 120 giây) thì bấm lại báo UserError, không có hai gợi ý đang chờ", async () => {
    const p = await product();
    await researchProduct({ productId: p.id });
    expect(await researchProduct({ productId: p.id })).toEqual({
      ok: false,
      error: "AI đang nghiên cứu Sản phẩm này. Chờ xong rồi thử lại.",
    });
    expect(await db.suggestion.count({ where: { productId: p.id } })).toBe(2);
  });

  it("partial unique index chặn hai gợi ý đang chờ cho cùng Sản phẩm ở mức DB", async () => {
    const p = await product();
    const data = { kind: "RESEARCH" as const, productId: p.id, promptId: "x", promptVersion: 1, status: "PENDING" as const };
    await db.suggestion.create({ data });
    await expect(db.suggestion.create({ data: { ...data, status: "GENERATING" } })).rejects.toMatchObject({ code: "P2002" });
    await db.suggestion.create({ data: { ...data, status: "REJECTED" } });
  });

  it("CHECK: gợi ý phải gắn đúng một đích", async () => {
    await expect(db.suggestion.create({ data: { kind: "RESEARCH", promptId: "x", promptVersion: 1 } })).rejects.toThrow();
  });

  it("GENERATING quá 120 giây hiện là Lỗi; Tạo lại đánh dấu bản cũ FAILED trong cùng transaction rồi chèn bản mới", async () => {
    const p = await product();
    await researchProduct({ productId: p.id });
    actionTest.afterCallbacks = []; // tiến trình khởi động lại: after() mất
    const old = new Date(Date.now() - 121_000);
    await db.suggestion.updateMany({ where: { productId: p.id }, data: { createdAt: old } });
    expect((await getProductSuggestionsForCms(p.id)).research).toMatchObject({ status: "FAILED", errorMessage: GENERATING_STALE });

    fakeAi.reply(aiReply());
    expect((await researchProduct({ productId: p.id, instruction: "ngắn hơn" })).ok).toBe(true);
    const rows = await suggestions(p.id);
    expect(rows.filter((r) => r.createdAt.getTime() === old.getTime()).map((r) => r.status)).toEqual(["FAILED", "FAILED"]);
    await runAfterCallbacks();
    expect(fakeAi.calls()[0].user).toContain("Chỉ dẫn khi viết lại: ngắn hơn");
  });

  it("Tạo lại từ Chờ duyệt: bản cũ SUPERSEDED (không hiện), bản mới mang parentSuggestionId, thay cả Danh mục gợi ý", async () => {
    const p = await product();
    const first = await researched(p);
    expect((await researchProduct({ productId: p.id, instruction: "vui hơn" })).ok).toBe(true);
    const rows = await suggestions(p.id);
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(byId.get(first.research!.id)?.status).toBe("SUPERSEDED");
    expect(byId.get(first.category!.id)?.status).toBe("SUPERSEDED");
    const view = await getProductSuggestionsForCms(p.id);
    expect(view.research?.status).toBe("GENERATING");
    expect(byId.get(view.research!.id)?.parentSuggestionId).toBe(first.research!.id);
    expect(byId.get(view.category!.id)?.parentSuggestionId).toBe(first.category!.id);
  });

  it("Tạo lại sau Từ chối hoặc Lỗi được; hồ sơ đã Duyệt thì không nghiên cứu lại", async () => {
    const p = await product();
    const first = await researched(p);
    expect(await rejectSuggestion({ id: first.research!.id })).toMatchObject({ ok: true });
    expect((await researchProduct({ productId: p.id })).ok).toBe(true);
    await runAfterCallbacks();
    const second = await getProductSuggestionsForCms(p.id);
    expect(await approveSuggestion({ id: second.research!.id })).toMatchObject({ ok: true });
    expect(await researchProduct({ productId: p.id })).toEqual({
      ok: false,
      error: "Hồ sơ nghiên cứu đã duyệt. Sửa trực tiếp trên hồ sơ.",
    });
  });

  it("Sản phẩm không tồn tại, chưa đăng nhập thì không ghi gì", async () => {
    expect(await researchProduct({ productId: "khong-co" })).toEqual({
      ok: false,
      error: "Không tìm thấy Sản phẩm. Có thể đã bị xoá.",
    });
    const p = await product();
    actionTest.authorization = null;
    expect(await researchProduct({ productId: p.id })).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
    expect(await db.suggestion.count()).toBe(0);
  });
});

describe("approveSuggestion", () => {
  it("Duyệt hồ sơ có sửa: upsert ResearchProfile, editedBeforeApproval, payload AI giữ nguyên, updateTag research", async () => {
    const p = await product();
    const { research } = await researched(p);
    const edited = { ...research!.payload!, angles: research!.payload!.angles.map((a, i) => (i === 0 ? { ...a, hook: "Câu mở mới" } : a)) };
    expect(await approveSuggestion({ id: research!.id, payload: edited })).toEqual({ ok: true, id: research!.id });
    const s = await db.suggestion.findUniqueOrThrow({ where: { id: research!.id } });
    expect(s).toMatchObject({ status: "APPROVED", editedBeforeApproval: true });
    expect((s.payload as { angles: { hook: string }[] }).angles[0].hook).toBe("Một nồi nấu cả tuần");
    const profile = await db.researchProfile.findUniqueOrThrow({ where: { productId: p.id } });
    expect((profile.data as { angles: { id: string; hook: string }[] }).angles[0]).toEqual({
      id: "goc-viet-1",
      name: "Tiết kiệm",
      hook: "Câu mở mới",
    });
    expect(actionTest.updatedTags).toEqual(["research"]);
  });

  it("Duyệt nguyên bản thì editedBeforeApproval = false", async () => {
    const { research } = await researched(await product());
    await approveSuggestion({ id: research!.id, payload: research!.payload });
    expect(await db.suggestion.findUniqueOrThrow({ where: { id: research!.id } })).toMatchObject({ editedBeforeApproval: false });
  });

  it("Duyệt hai lần (kể cả cùng lúc) không tạo hai ResearchProfile; lần sau báo UserError", async () => {
    const p = await product();
    const { research } = await researched(p);
    const results = await Promise.all([approveSuggestion({ id: research!.id }), approveSuggestion({ id: research!.id })]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.find((r) => !r.ok)).toEqual({ ok: false, error: "Gợi ý này không còn chờ duyệt. Tải lại trang." });
    expect(await db.researchProfile.count({ where: { productId: p.id } })).toBe(1);
  });

  it("nội dung sửa sai schema báo lỗi tại trường, không Duyệt", async () => {
    const { research } = await researched(await product());
    const bad = { ...research!.payload!, angles: research!.payload!.angles.slice(0, 2) };
    const res = await approveSuggestion({ id: research!.id, payload: bad });
    expect(res.ok).toBe(false);
    expect(await db.researchProfile.count()).toBe(0);
    expect((await db.suggestion.findUniqueOrThrow({ where: { id: research!.id } })).status).toBe("PENDING");
  });

  it("Duyệt Danh mục gợi ý ghi Product.categoryId, updateTag products; không có Tạo lại riêng", async () => {
    const p = await product();
    const { category } = await researched(p);
    expect(await approveSuggestion({ id: category!.id })).toEqual({ ok: true, id: category!.id });
    expect((await db.product.findUniqueOrThrow({ where: { id: p.id } })).categoryId).toBe(categoryId);
    expect(actionTest.updatedTags).toEqual(["products"]);
    expect((await getProductSuggestionsForCms(p.id)).category?.status).toBe("APPROVED");
  });

  it("Danh mục gợi ý đã bị xoá thì báo UserError, Sản phẩm giữ Danh mục cũ, gợi ý vẫn chờ", async () => {
    const p = await product();
    const { category } = await researched(p);
    await db.category.delete({ where: { id: categoryId } });
    expect(await approveSuggestion({ id: category!.id })).toEqual({
      ok: false,
      error: "Danh mục đã chọn không còn tồn tại. Tải lại trang rồi chọn lại.",
    });
    expect((await db.suggestion.findUniqueOrThrow({ where: { id: category!.id } })).status).toBe("PENDING");
  });

  it("gợi ý đang tạo hoặc không tồn tại thì không Duyệt được", async () => {
    const p = await product();
    await researchProduct({ productId: p.id });
    const generating = await db.suggestion.findFirstOrThrow({ where: { productId: p.id, kind: "RESEARCH" } });
    expect(await approveSuggestion({ id: generating.id })).toEqual({
      ok: false,
      error: "Gợi ý này không còn chờ duyệt. Tải lại trang.",
    });
    expect(await approveSuggestion({ id: "khong-co" })).toEqual({ ok: false, error: "Không tìm thấy gợi ý. Tải lại trang." });
  });
});

describe("rejectSuggestion", () => {
  it("Từ chối gợi ý đang chờ → REJECTED; từ chối lại báo UserError", async () => {
    const { research } = await researched(await product());
    expect(await rejectSuggestion({ id: research!.id })).toEqual({ ok: true, id: research!.id });
    expect((await db.suggestion.findUniqueOrThrow({ where: { id: research!.id } })).status).toBe("REJECTED");
    expect(await rejectSuggestion({ id: research!.id })).toEqual({
      ok: false,
      error: "Gợi ý này không còn chờ duyệt. Tải lại trang.",
    });
    expect(actionTest.updatedTags).toEqual([]);
  });
});
