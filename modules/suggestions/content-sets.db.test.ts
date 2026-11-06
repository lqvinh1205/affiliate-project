import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeAi } from "@/platform/ai/providers/fake";
import { ProviderError, type ProviderRequest } from "@/platform/ai/providers/types";
import { db } from "@/platform/db";
import { actionTest, resetTestDb, runAfterCallbacks } from "@/vitest.db.helpers";
import { getContentSetForCms, listPostedPlatformsByProductForCms } from "@/modules/content-sets/cms-queries";
import {
  addContentSetPlatform,
  approveSuggestion,
  createContentSet,
  createSocialFromPost,
  recordSuggestionCopy,
  regenerateSuggestion,
  rejectSuggestion,
} from "@/modules/suggestions/actions";
import { getContentSetSuggestionsForCms, getPostAiStateForCms } from "@/modules/suggestions/cms-queries";
import { PART_FAILED, PART_STALE } from "@/modules/suggestions/constants";

const PROFILE = {
  info: [{ id: "info-1", text: "Rửa được bằng máy", sourceUrl: "https://example.com/noi" }],
  infoNote: null,
  imageDescription: "Nồi màu kem",
  reviewSummary: { praise: ["Nấu nhanh"], complaints: ["Hơi ồn"], fit: ["Nhà nhỏ"] },
  audiences: [
    { id: "doc-gia-1", name: "Sinh viên", reason: "Bếp nhỏ" },
    { id: "doc-gia-2", name: "Mẹ bỉm", reason: "Ít thời gian" },
  ],
  angles: [
    { id: "goc-viet-1", name: "Tiết kiệm", hook: "Một nồi nấu cả tuần" },
    { id: "goc-viet-2", name: "Gọn", hook: "Bếp nhỏ vẫn đủ" },
    { id: "goc-viet-3", name: "Nhanh", hook: "Mười phút có cơm" },
  ],
};

let categoryId: string;

async function product(name: string, url: string, profile: boolean | "pending" = true) {
  const p = await db.product.create({ data: { name, affiliateUrl: url } });
  if (profile === true) await db.researchProfile.create({ data: { productId: p.id, data: PROFILE } });
  if (profile === "pending") {
    await db.suggestion.create({
      data: { kind: "RESEARCH", status: "PENDING", productId: p.id, payload: PROFILE, promptId: "research.product", promptVersion: 1 },
    });
  }
  return p;
}

const keys = (req: ProviderRequest) => Object.keys((req.jsonSchema as { properties: object }).properties);

// Câu trả lời giả lập theo phần (nhận ra qua JSON Schema của prompt). `fail`: phần trả lỗi nhà cung cấp.
function aiReply(fail: ("web" | "threads" | "facebook" | "comment")[] = []) {
  return (req: ProviderRequest) => {
    const k = keys(req);
    const part = k.includes("title") ? "web" : k.includes("posts") ? "threads" : k.includes("body") ? "facebook" : "comment";
    if (fail.includes(part)) throw new ProviderError("unavailable", `${part} lỗi giả lập`);
    if (part === "web") {
      return {
        title: "Nồi chiên cho phòng trọ",
        excerpt: "Tóm tắt",
        content: "<h2>Vì sao</h2><p>Diệt 99% vi khuẩn.</p><a href='https://x.vn'>mua</a>",
        tags: ["bếp"],
        seoTitle: "Nồi chiên",
        seoDescription: "Mô tả",
        seoKeywords: ["nồi chiên"],
        postType: "GOM_LINK",
        categoryId,
        riskWarnings: [{ sentence: "Diệt 99% vi khuẩn.", reason: "Khẳng định công dụng chưa có căn cứ" }],
      };
    }
    if (part === "threads") return { posts: ["Hook 🔥", "Bài 2 xem https://x.vn"], riskWarnings: [] };
    if (part === "facebook") return { body: "Bài Facebook\nDòng 2", riskWarnings: [] };
    return { comment: "Link nè: https://bit.ly/fake", riskWarnings: [] };
  };
}

const ALL = ["WEBSITE", "THREADS", "FACEBOOK"] as const;

async function created(productIds: string[], platforms: readonly ("WEBSITE" | "THREADS" | "FACEBOOK")[] = ALL) {
  const res = await createContentSet({
    productIds,
    angle: { productId: productIds[0], id: "goc-viet-2" },
    angleEdit: "Bếp 10m² vẫn đủ",
    audience: { productId: productIds[0], id: "doc-gia-1" },
    platforms: [...platforms],
  });
  if (!res.ok) throw new Error(res.error);
  return res.contentSetId;
}

async function generated(productIds: string[], platforms: readonly ("WEBSITE" | "THREADS" | "FACEBOOK")[] = ALL, fail: Parameters<typeof aiReply>[0] = []) {
  fakeAi.reply(aiReply(fail));
  const id = await created(productIds, platforms);
  await runAfterCallbacks();
  return { id, parts: await getContentSetSuggestionsForCms(id) };
}

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
  categoryId = (await db.category.create({ data: { name: "Nhà bếp", slug: "nha-bep" } })).id;
});

afterAll(() => db.$disconnect());

describe("createContentSet (FR-12, Story 5.2–5.4)", () => {
  it("hồ sơ chưa Duyệt hoặc món thêm chưa có hồ sơ → UserError, không tạo bộ", async () => {
    const pending = await product("Nồi", "https://s.shopee.vn/a", "pending");
    expect(await createContentSet({ productIds: [pending.id], angle: { productId: pending.id, id: "goc-viet-1" }, audience: { productId: pending.id, id: "doc-gia-1" }, platforms: ["WEBSITE"] })).toEqual({
      ok: false,
      error: "Duyệt Hồ sơ nghiên cứu trước",
    });
    const ok = await product("Chảo", "https://s.shopee.vn/b");
    const none = await product("Kệ", "https://s.shopee.vn/c", false);
    expect(await createContentSet({ productIds: [ok.id, none.id], angle: { productId: ok.id, id: "goc-viet-1" }, audience: { productId: ok.id, id: "doc-gia-1" }, platforms: ["WEBSITE"] })).toEqual({
      ok: false,
      error: "'Kệ' chưa có hồ sơ đã duyệt",
    });
    expect(await createContentSet({ productIds: [ok.id], angle: { productId: ok.id, id: "goc-viet-9" }, audience: { productId: ok.id, id: "doc-gia-1" }, platforms: ["WEBSITE"] })).toEqual({
      ok: false,
      error: "Góc viết đã chọn không còn trong hồ sơ. Chọn lại.",
    });
    expect(await db.contentSet.count()).toBe(0);
  });

  it("đủ 3 nền tảng: bộ + 5 gợi ý GENERATING, trả ngay; after() gọi AI 5 lần riêng, song song", async () => {
    const p = await product("Nồi chiên", "https://s.shopee.vn/a");
    fakeAi.reply(aiReply());
    const id = await created([p.id]);
    const rows = await db.suggestion.findMany({ where: { contentSetId: id }, orderBy: { kind: "asc" } });
    expect(rows.map((r) => [r.kind, r.platform, r.status]).sort()).toEqual(
      [
        ["FACEBOOK_POST", "FACEBOOK", "GENERATING"],
        ["LINK_COMMENT", "FACEBOOK", "GENERATING"],
        ["LINK_COMMENT", "THREADS", "GENERATING"],
        ["THREADS_POST", "THREADS", "GENERATING"],
        ["WEB_POST", "WEBSITE", "GENERATING"],
      ].sort(),
    );
    expect(fakeAi.calls()).toHaveLength(0);
    expect(actionTest.updatedTags).toEqual([]);
    const set = await getContentSetForCms(id);
    expect(set).toMatchObject({ angleId: "goc-viet-2", angleName: "Gọn", angleEdit: "Bếp 10m² vẫn đủ", audienceName: "Sinh viên", postId: null });

    await runAfterCallbacks();
    expect(fakeAi.calls()).toHaveLength(5);
    const parts = await getContentSetSuggestionsForCms(id);
    expect(Object.values(parts).every((v) => v?.status === "PENDING")).toBe(true);
    // Prompt dùng Hồ sơ phong cách (giá trị khởi tạo) và bản sửa Góc viết; nguồn là hồ sơ đã Duyệt.
    const web = fakeAi.calls().find((c) => keys(c).includes("title"))!;
    expect(web.system).toContain("600–900 từ");
    expect(web.user).toContain("Gọn — Bếp 10m² vẫn đủ");
    expect(web.user).toContain("Rửa được bằng máy");
    expect(parts.web?.payload?.content).not.toContain("<a");
    expect(parts.web?.riskWarnings).toEqual([{ sentence: "Diệt 99% vi khuẩn.", reason: "Khẳng định công dụng chưa có căn cứ" }]);
    expect(parts.threads?.payload?.posts).toEqual(["Hook 🔥", "Bài 2 xem"]);
    expect(parts.threadsComment?.payload?.comment).toContain("https://s.shopee.vn/a");
    expect(parts.threadsComment?.payload?.comment).not.toContain("bit.ly");
  });

  it("một phần lỗi chỉ phần đó FAILED kèm thông báo tiếng Việt; phần khác giữ nguyên (UX-DR96)", async () => {
    const p = await product("Nồi chiên", "https://s.shopee.vn/a");
    const { parts } = await generated([p.id], ALL, ["facebook"]);
    expect(parts.facebook).toMatchObject({ status: "FAILED", errorMessage: PART_FAILED.FACEBOOK_POST });
    expect(parts.web?.status).toBe("PENDING");
    expect(parts.facebookComment?.status).toBe("PENDING");
    expect(parts.threads?.status).toBe("PENDING");
  });

  it("bộ 3 Sản phẩm: Bình luận chứa Link affiliate của cả 3; câu công khai khi hồ sơ có (FR-17, FR-18)", async () => {
    await db.styleProfile.create({
      data: { platform: "THREADS", voice: "Vui", lengthMin: 40, lengthMax: 250, partsMin: 4, partsMax: 7, emoji: "", forbidden: "", rules: "", disclosure: "Mình nhận hoa hồng." },
    });
    const a = await product("Nồi", "https://s.shopee.vn/a");
    const b = await product("Chảo", "https://s.shopee.vn/b");
    const c = await product("Kệ", "https://s.shopee.vn/c");
    const { id, parts } = await generated([a.id, b.id, c.id], ["THREADS"]);
    for (const url of ["https://s.shopee.vn/a", "https://s.shopee.vn/b", "https://s.shopee.vn/c"]) {
      expect(parts.threadsComment?.payload?.comment).toContain(url);
    }
    expect(parts.threadsComment?.payload?.comment).toContain("Mình nhận hoa hồng.");
    expect((await getContentSetForCms(id))?.products.map((p) => p.name)).toEqual(["Nồi", "Chảo", "Kệ"]);
    expect(parts.web).toBeNull();
  });

  it("GENERATING quá 120 giây hiện là Lỗi (AD-18)", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    fakeAi.reply(aiReply());
    const id = await created([p.id], ["WEBSITE"]);
    await db.suggestion.updateMany({ where: { contentSetId: id }, data: { createdAt: new Date(Date.now() - 121_000) } });
    expect((await getContentSetSuggestionsForCms(id)).web).toMatchObject({ status: "FAILED", errorMessage: PART_STALE });
  });

  it("chưa đăng nhập bị chặn", async () => {
    actionTest.authorization = null;
    expect(await createContentSet({ productIds: ["x"], angle: { productId: "x", id: "a" }, audience: { productId: "x", id: "b" }, platforms: ["WEBSITE"] })).toEqual({
      ok: false,
      error: "Bạn cần đăng nhập CMS",
    });
  });
});

describe("Duyệt các phần của Bộ nội dung (AD-19)", () => {
  it("Duyệt WEB_POST: tạo Post nháp gắn Sản phẩm của bộ, khoá ContentSet.postId; sửa trước Duyệt được ghi", async () => {
    const a = await product("Nồi", "https://s.shopee.vn/a");
    const b = await product("Chảo", "https://s.shopee.vn/b");
    const { id, parts } = await generated([a.id, b.id], ["WEBSITE"]);
    const res = await approveSuggestion({ id: parts.web!.id, payload: { ...parts.web!.payload, title: "Tiêu đề đã sửa" } });
    expect(res.ok).toBe(true);
    const set = await getContentSetForCms(id);
    const post = await db.post.findUniqueOrThrow({ where: { id: set!.postId! }, include: { postProducts: { orderBy: { sortOrder: "asc" } } } });
    expect(post).toMatchObject({ title: "Tiêu đề đã sửa", status: "DRAFT", postType: "GOM_LINK", categoryId });
    expect(post.content).not.toContain("<a");
    expect(post.postProducts.map((pp) => pp.productId)).toEqual([a.id, b.id]);
    expect(await db.suggestion.findUniqueOrThrow({ where: { id: parts.web!.id } })).toMatchObject({ status: "APPROVED", editedBeforeApproval: true });
    expect(actionTest.updatedTags).toEqual(["posts", "content-sets"]);
    // Duyệt lần hai: không tạo bài thứ hai.
    expect((await approveSuggestion({ id: parts.web!.id })).ok).toBe(false);
    expect(await db.post.count()).toBe(1);
  });

  it("Tạo lại Bài web sau khi bài đã xuất bản: Duyệt bị chặn, khoá Xuất bản ở màn soạn (Story 5.7)", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    const { id, parts } = await generated([p.id], ["WEBSITE"]);
    await approveSuggestion({ id: parts.web!.id });
    const postId = (await getContentSetForCms(id))!.postId!;
    expect(await getPostAiStateForCms(postId)).toMatchObject({ contentSetId: id, locked: false });
    expect((await getPostAiStateForCms(postId)).riskWarnings).toHaveLength(1);

    fakeAi.reply(aiReply());
    const regen = await regenerateSuggestion({ id: parts.web!.id, instruction: "ngắn hơn" });
    expect(regen.ok).toBe(true);
    expect(await db.suggestion.findUniqueOrThrow({ where: { id: parts.web!.id } })).toMatchObject({ status: "SUPERSEDED" });
    expect(await getPostAiStateForCms(postId)).toMatchObject({ locked: true });
    await runAfterCallbacks();
    expect(fakeAi.calls().at(-1)?.user).toContain("Chỉ dẫn khi viết lại: ngắn hơn");
    const next = (await getContentSetSuggestionsForCms(id)).web!;
    expect(next.status).toBe("PENDING");
    expect(await db.suggestion.findUniqueOrThrow({ where: { id: next.id } })).toMatchObject({ parentSuggestionId: parts.web!.id });

    await db.post.update({ where: { id: postId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    expect(await approveSuggestion({ id: next.id })).toEqual({ ok: false, error: "Bài đã xuất bản — sửa tay ở Soạn Bài web" });
    expect((await db.post.findUniqueOrThrow({ where: { id: postId } })).status).toBe("PUBLISHED");
  });

  it("Bình luận cần bài cùng nền tảng đã Duyệt; Duyệt bài rồi Bình luận ghi vào SocialPost", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    const { id, parts } = await generated([p.id], ["THREADS"]);
    expect(await approveSuggestion({ id: parts.threadsComment!.id })).toEqual({ ok: false, error: "Duyệt bài Threads trước" });
    expect((await approveSuggestion({ id: parts.threads!.id })).ok).toBe(true);
    expect((await approveSuggestion({ id: parts.threadsComment!.id })).ok).toBe(true);
    const social = await db.socialPost.findFirstOrThrow({ where: { contentSetId: id } });
    expect(social).toMatchObject({ platform: "THREADS", parts: ["Hook 🔥", "Bài 2 xem"] });
    expect(social.linkComment).toContain("https://s.shopee.vn/a");
    expect(actionTest.updatedTags).toEqual(["content-sets", "content-sets"]);
  });

  it("chuỗi Threads có bài > 500 ký tự hoặc đổi số bài thì không Duyệt được (UX-DR41)", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    const { parts } = await generated([p.id], ["THREADS"]);
    expect(await approveSuggestion({ id: parts.threads!.id, payload: { posts: ["ok", "x".repeat(501)] } })).toEqual({
      ok: false,
      error: "Bài 2 vượt 500 ký tự",
    });
    expect(await approveSuggestion({ id: parts.threads!.id, payload: { posts: ["chỉ một bài"] } })).toEqual({
      ok: false,
      error: "Không thêm/xoá bài trong chuỗi. Muốn đổi số bài thì Tạo lại.",
    });
    expect(await db.socialPost.count()).toBe(0);
  });

  it("Từ chối một phần: các phần khác giữ nguyên; Tạo lại được", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    const { id, parts } = await generated([p.id], ["FACEBOOK"]);
    expect((await rejectSuggestion({ id: parts.facebook!.id })).ok).toBe(true);
    const after = await getContentSetSuggestionsForCms(id);
    expect(after.facebook?.status).toBe("REJECTED");
    expect(after.facebookComment?.status).toBe("PENDING");
    fakeAi.reply(aiReply());
    expect((await regenerateSuggestion({ id: parts.facebook!.id })).ok).toBe(true);
    expect((await getContentSetSuggestionsForCms(id)).facebook?.status).toBe("GENERATING");
    expect(await regenerateSuggestion({ id: parts.facebook!.id })).toEqual({
      ok: false,
      error: "Phần này vừa được tạo lại ở nơi khác. Tải lại trang.",
    });
  });
});

describe("Tạo lại phần đã Duyệt (Story 5.7)", () => {
  it("Threads đã Duyệt: Tạo lại giữ SocialPost và query màn vẫn trả đích; bản mới lỗi thì đích vẫn còn", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    const { id, parts } = await generated([p.id], ["THREADS"]);
    await approveSuggestion({ id: parts.threads!.id });
    await approveSuggestion({ id: parts.threadsComment!.id });
    const before = await db.socialPost.findFirstOrThrow({ where: { contentSetId: id } });

    fakeAi.reply(aiReply(["threads"]));
    expect((await regenerateSuggestion({ id: parts.threads!.id, instruction: "ngắn hơn" })).ok).toBe(true);
    await runAfterCallbacks();
    const now = await getContentSetSuggestionsForCms(id);
    expect(now.threads).toMatchObject({ status: "FAILED", errorMessage: PART_FAILED.THREADS_POST });
    expect(now.threadsComment?.status).toBe("APPROVED");
    expect(await db.socialPost.findFirstOrThrow({ where: { contentSetId: id } })).toMatchObject({
      id: before.id,
      parts: before.parts,
      linkComment: before.linkComment,
    });
    // Màn Bộ nội dung đọc đích qua `getContentSetForCms` → thẻ "bản đã duyệt (đang dùng)".
    expect((await getContentSetForCms(id))?.socialPosts).toEqual([
      expect.objectContaining({ id: before.id, platform: "THREADS", parts: before.parts }),
    ]);
  });

  it("phần đang tạo (chưa quá hạn) → UserError, không tạo gợi ý mới", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    fakeAi.reply(aiReply());
    const id = await created([p.id], ["FACEBOOK"]);
    const busy = (await getContentSetSuggestionsForCms(id)).facebook!;
    expect(busy.status).toBe("GENERATING");
    expect(await regenerateSuggestion({ id: busy.id })).toEqual({ ok: false, error: "AI đang viết phần này. Chờ xong rồi thử lại." });
    expect(await db.suggestion.count({ where: { contentSetId: id, kind: "FACEBOOK_POST" } })).toBe(1);
  });
});

describe("Bình luận kèm link theo giới hạn nền tảng (FR-14, FR-17)", () => {
  it("Link affiliate quá dài cho Bình luận Threads: thẻ Lỗi nói rõ cần rút gọn link (Tạo lại cũng không sửa được)", async () => {
    const urls = ["a", "b", "c"].map((x) => `https://shopee.vn/product/${x}?${"t".repeat(200)}`);
    const ps = [];
    for (const [i, u] of urls.entries()) ps.push(await product(`Món ${i}`, u));
    const { parts } = await generated(ps.map((x) => x.id), ["THREADS"]);
    expect(parts.threadsComment?.status).toBe("FAILED");
    expect(parts.threadsComment?.errorMessage).toContain("Rút gọn Link affiliate ở Sản phẩm rồi Tạo lại.");
    expect(parts.threads?.status).toBe("PENDING");
  });

  it("Duyệt Bình luận Threads > 500 ký tự bị chặn", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    const { parts } = await generated([p.id], ["THREADS"]);
    await approveSuggestion({ id: parts.threads!.id });
    expect(await approveSuggestion({ id: parts.threadsComment!.id, payload: { comment: "x".repeat(501) } })).toEqual({
      ok: false,
      error: "Bình luận Threads vượt 500 ký tự",
    });
  });
});

describe("Copy trước Duyệt (FR-19, FR-22, AD-21)", () => {
  it("ghi Suggestion.firstCopiedAt một lần; Duyệt bài rồi Bình luận chép mốc sang SocialPost nếu đích chưa có", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    const { parts } = await generated([p.id], ["THREADS"]);
    expect((await recordSuggestionCopy({ id: parts.threadsComment!.id })).ok).toBe(true);
    const first = (await db.suggestion.findUniqueOrThrow({ where: { id: parts.threadsComment!.id } })).firstCopiedAt!;
    await recordSuggestionCopy({ id: parts.threadsComment!.id });
    expect((await db.suggestion.findUniqueOrThrow({ where: { id: parts.threadsComment!.id } })).firstCopiedAt).toEqual(first);
    await approveSuggestion({ id: parts.threads!.id });
    expect((await db.socialPost.findFirstOrThrow()).firstCopiedAt).toBeNull();
    await approveSuggestion({ id: parts.threadsComment!.id });
    expect((await db.socialPost.findFirstOrThrow()).firstCopiedAt).toEqual(first);
    expect(actionTest.updatedTags).toEqual(["content-sets", "content-sets"]);
  });

  it("gợi ý không tồn tại → UserError", async () => {
    expect(await recordSuggestionCopy({ id: "khong-co" })).toEqual({ ok: false, error: "Không tìm thấy gợi ý. Tải lại trang." });
  });
});

describe("Thêm nền tảng và chuyển Bài web thành bài mạng xã hội (FR-16, UX-DR75)", () => {
  it("Thêm Bài Facebook vào bộ đang có; nền tảng đã có → UserError", async () => {
    const p = await product("Nồi", "https://s.shopee.vn/a");
    const { id } = await generated([p.id], ["THREADS"]);
    expect(await addContentSetPlatform({ contentSetId: id, platform: "THREADS" })).toEqual({ ok: false, error: "Bộ đã có Bài Threads" });
    expect((await addContentSetPlatform({ contentSetId: id, platform: "FACEBOOK" })).ok).toBe(true);
    const parts = await getContentSetSuggestionsForCms(id);
    expect([parts.facebook?.status, parts.facebookComment?.status]).toEqual(["GENERATING", "GENERATING"]);
  });

  it("Bài web chưa gắn Sản phẩm → UserError; bài chưa thuộc bộ → tạo bộ mới gắn bài + Sản phẩm, nguồn là nội dung bài", async () => {
    const empty = await db.post.create({ data: { title: "Bài trống", slug: "bai-trong", content: "<p>x</p>", postType: "MEO_VAT" } });
    expect(await createSocialFromPost({ postId: empty.id, platforms: ["THREADS"] })).toEqual({
      ok: false,
      error: "Gắn ít nhất một Sản phẩm để có Link affiliate cho Bình luận",
    });
    const p = await product("Nồi", "https://s.shopee.vn/a", false);
    const post = await db.post.create({
      data: {
        title: "Mẹo dùng nồi chiên",
        slug: "meo-noi-chien",
        content: "<h2>Mẹo</h2><p>Lót giấy nến cho dễ rửa.</p>",
        postType: "MEO_VAT",
        status: "PUBLISHED",
        publishedAt: new Date(),
        postProducts: { create: [{ productId: p.id, sortOrder: 0 }] },
      },
    });
    fakeAi.reply(aiReply());
    const res = await createSocialFromPost({ postId: post.id, platforms: ["THREADS"] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const set = await getContentSetForCms(res.contentSetId);
    expect(set).toMatchObject({ postId: post.id, angleId: null });
    expect(set?.products.map((x) => x.id)).toEqual([p.id]);
    await runAfterCallbacks();
    const threadsCall = fakeAi.calls().find((c) => keys(c).includes("posts"))!;
    expect(threadsCall.user).toContain("Lót giấy nến cho dễ rửa.");
    expect(threadsCall.system).toContain("4–7 bài");
    // Lần hai: dùng lại bộ của bài; nền tảng đã có → UserError.
    expect(await createSocialFromPost({ postId: post.id, platforms: ["THREADS"] })).toEqual({ ok: false, error: "Bộ đã có Bài Threads" });
    // Bài đổi Sản phẩm ở Soạn Bài web: bộ theo Sản phẩm hiện tại của bài → Bình luận có link của Sản phẩm mới.
    const q = await product("Chảo", "https://s.shopee.vn/q", false);
    await db.postProduct.deleteMany({ where: { postId: post.id } });
    await db.postProduct.create({ data: { postId: post.id, productId: q.id, sortOrder: 0 } });
    expect((await createSocialFromPost({ postId: post.id, platforms: ["FACEBOOK"] })).ok).toBe(true);
    expect(await db.contentSet.count()).toBe(1);
    expect((await getContentSetForCms(res.contentSetId))?.products.map((x) => x.id)).toEqual([q.id]);
    await runAfterCallbacks();
    const comment = (await getContentSetSuggestionsForCms(res.contentSetId)).facebookComment;
    expect(comment?.payload?.comment).toContain("https://s.shopee.vn/q");
    expect(comment?.payload?.comment).not.toContain("https://s.shopee.vn/a");
    expect((await listPostedPlatformsByProductForCms([q.id])).get(q.id)).toEqual(["WEBSITE"]);
  });
});
