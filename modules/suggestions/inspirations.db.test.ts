import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeAi } from "@/platform/ai/providers/fake";
import { ProviderError, type ProviderRequest } from "@/platform/ai/providers/types";
import { db } from "@/platform/db";
import { actionTest, resetTestDb, runAfterCallbacks } from "@/vitest.db.helpers";
import { listInspirationsForCms } from "@/modules/content-sets/cms-queries";
import { getInspirationResearchForCms } from "@/modules/research/cms-queries";
import {
  approveSuggestion,
  createContentSet,
  rejectSuggestion,
  researchInspiration,
} from "@/modules/suggestions/actions";
import { getInspirationSuggestionForCms } from "@/modules/suggestions/cms-queries";
import { INSPIRATION_GENERATING_STALE, INSPIRATION_RESEARCH_FAILED } from "@/modules/suggestions/constants";

const sha = "d".repeat(64);

function aiReply(patch: { keywords?: string[]; sources?: { url: string; title: string }[] } = {}) {
  return () => ({
    data: {
      summary: "Mẹo gấp áo thun bằng tấm bìa",
      keywords: patch.keywords ?? ["bảng gấp quần áo", "kẹp gấp áo"],
      outline: [
        { heading: "Mở bài", detail: "Gấp áo mất thời gian" },
        { heading: "Các bước", detail: "Dùng bảng gấp" },
      ],
    },
    sources: patch.sources ?? [{ url: "https://www.tiktok.com/@a/video/1", title: "Mẹo gấp áo" }],
  });
}

async function inspiration(data: { url?: string | null; mediaUrl?: string | null; note?: string | null } = {}) {
  return db.inspiration.create({
    data: { url: "url" in data ? data.url : "https://vt.tiktok.com/ZS1/", mediaUrl: data.mediaUrl ?? null, note: data.note ?? "gấp áo" },
  });
}

async function researched(id: string, reply = aiReply()) {
  fakeAi.reply(reply);
  const res = await researchInspiration({ inspirationId: id });
  expect(res.ok).toBe(true);
  await runAfterCallbacks();
  return getInspirationSuggestionForCms(id);
}

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => db.$disconnect());

describe("researchInspiration (FR-2, UX-DR77)", () => {
  it("ghi RESEARCH gắn inspirationId ở GENERATING, trả ngay, chưa gọi AI cho tới after()", async () => {
    const i = await inspiration();
    fakeAi.reply(aiReply());
    const res = await researchInspiration({ inspirationId: i.id });
    expect(res.ok).toBe(true);
    const rows = await db.suggestion.findMany({ where: { inspirationId: i.id } });
    expect(rows.map((r) => [r.kind, r.status, r.promptId])).toEqual([["RESEARCH", "GENERATING", "research.inspiration"]]);
    expect(fakeAi.calls()).toHaveLength(0);
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("link video: AI tìm web với link + ghi chú; không đọc được video → skipped có video; payload từ khoá + dàn ý", async () => {
    const i = await inspiration();
    const view = await researched(i.id);
    expect(fakeAi.calls()).toHaveLength(1);
    const call = fakeAi.calls()[0] as ProviderRequest;
    expect(call).toMatchObject({ webSearch: true, images: [], profile: "quality" });
    expect(call.user).toContain("https://vt.tiktok.com/ZS1/ (link video)");
    expect(call.user).toContain("gấp áo");
    expect(view).toMatchObject({
      status: "PENDING",
      skipped: ["video"],
      sources: [{ url: "https://www.tiktok.com/@a/video/1", title: "Mẹo gấp áo" }],
      payload: {
        summary: "Mẹo gấp áo thun bằng tấm bìa",
        keywords: [
          { id: "tu-khoa-1", text: "bảng gấp quần áo" },
          { id: "tu-khoa-2", text: "kẹp gấp áo" },
        ],
      },
    });
  });

  it("file ảnh tải lên: AI đọc ảnh; không có link thì không tìm web, không skipped video", async () => {
    const i = await inspiration({ url: null, mediaUrl: `/uploads/${sha}.jpg` });
    const view = await researched(i.id, aiReply({ sources: [] }));
    expect(fakeAi.calls()[0]).toMatchObject({ webSearch: false, images: [`/uploads/${sha}.jpg`] });
    expect(view?.skipped).toEqual([]);
  });

  it("file video tải lên: gửi như video, nhà AI chưa đọc được → skipped video", async () => {
    const i = await inspiration({ url: "https://shopee.vn/x", mediaUrl: `/uploads/${sha}.mp4` });
    const view = await researched(i.id);
    expect(fakeAi.calls()[0].images).toEqual([]);
    expect(view?.skipped).toEqual(["video"]);
  });

  it("AI lỗi → FAILED kèm thông báo tiếng Việt; Cảm hứng giữ nguyên", async () => {
    const i = await inspiration();
    fakeAi.reply(() => {
      throw new ProviderError("unavailable", "lỗi giả lập");
    });
    await researchInspiration({ inspirationId: i.id });
    await runAfterCallbacks();
    const view = await getInspirationSuggestionForCms(i.id);
    expect(view?.status).toBe("FAILED");
    expect(view?.errorMessage).toMatch(/^Chưa nghiên cứu được Cảm hứng\./);
    expect(await db.inspiration.findUniqueOrThrow({ where: { id: i.id } })).toMatchObject({ note: "gấp áo" });
  });

  it("lỗi bất ngờ (payload không đủ từ khoá) → FAILED câu chung", async () => {
    const i = await inspiration();
    fakeAi.reply(aiReply({ keywords: ["  "] }));
    await researchInspiration({ inspirationId: i.id });
    await expect(runAfterCallbacks()).rejects.toThrow();
    const view = await getInspirationSuggestionForCms(i.id);
    expect(view).toMatchObject({ status: "FAILED", errorMessage: INSPIRATION_RESEARCH_FAILED });
  });

  it("đang tạo thì không bấm lại được; quá 120 giây coi là FAILED, Tạo lại được", async () => {
    const i = await inspiration();
    fakeAi.reply(aiReply());
    expect((await researchInspiration({ inspirationId: i.id })).ok).toBe(true);
    const again = await researchInspiration({ inspirationId: i.id });
    expect(again).toEqual({ ok: false, error: "AI đang nghiên cứu Cảm hứng này. Chờ xong rồi thử lại." });
    await db.suggestion.updateMany({ where: { inspirationId: i.id }, data: { createdAt: new Date(Date.now() - 121_000) } });
    expect(await getInspirationSuggestionForCms(i.id)).toMatchObject({ status: "FAILED", errorMessage: INSPIRATION_GENERATING_STALE });
    expect((await researchInspiration({ inspirationId: i.id })).ok).toBe(true);
    const rows = await db.suggestion.findMany({ where: { inspirationId: i.id }, orderBy: { createdAt: "asc" } });
    expect(rows.map((r) => r.status)).toEqual(["FAILED", "GENERATING"]);
    expect(rows[1].parentSuggestionId).toBe(rows[0].id);
  });

  it("Tạo lại bản chờ duyệt kèm chỉ dẫn: bản cũ SUPERSEDED, bản mới mang parentSuggestionId", async () => {
    const i = await inspiration();
    const first = await researched(i.id);
    fakeAi.reply(aiReply({ keywords: ["giá phơi đồ"] }));
    expect((await researchInspiration({ inspirationId: i.id, instruction: "ngắn hơn" })).ok).toBe(true);
    await runAfterCallbacks();
    expect(fakeAi.calls()[1].user).toContain("Chỉ dẫn khi viết lại: ngắn hơn");
    const old = await db.suggestion.findUniqueOrThrow({ where: { id: first!.id } });
    expect(old.status).toBe("SUPERSEDED");
    const view = await getInspirationSuggestionForCms(i.id);
    expect(view?.payload?.keywords.map((k) => k.text)).toEqual(["giá phơi đồ"]);
  });

  it("Cảm hứng không có → lỗi tiếng Việt; chưa đăng nhập → bị từ chối", async () => {
    expect(await researchInspiration({ inspirationId: "khong-co" })).toEqual({
      ok: false,
      error: "Không tìm thấy Cảm hứng. Có thể đã bị xoá.",
    });
    const i = await inspiration();
    actionTest.authorization = null;
    expect((await researchInspiration({ inspirationId: i.id })).ok).toBe(false);
    expect(await db.suggestion.count()).toBe(0);
  });
});

describe("Duyệt / Từ chối hồ sơ Cảm hứng (AD-19)", () => {
  it("Duyệt bản đã sửa → ResearchProfile theo inspirationId, editedBeforeApproval, tag research; Duyệt lại bị chặn", async () => {
    const i = await inspiration();
    const view = await researched(i.id);
    const payload = { ...view!.payload!, keywords: [{ id: "tu-khoa-1", text: "bảng gấp áo nhựa" }, view!.payload!.keywords[1]] };
    const res = await approveSuggestion({ id: view!.id, payload });
    expect(res.ok).toBe(true);
    expect(actionTest.updatedTags).toEqual(["research"]);
    const profile = await getInspirationResearchForCms(i.id);
    expect(profile?.data.keywords[0].text).toBe("bảng gấp áo nhựa");
    const s = await db.suggestion.findUniqueOrThrow({ where: { id: view!.id } });
    expect(s).toMatchObject({ status: "APPROVED", editedBeforeApproval: true });
    expect((await approveSuggestion({ id: view!.id })).ok).toBe(false);
    expect(await db.researchProfile.count({ where: { inspirationId: i.id } })).toBe(1);
    // Hồ sơ đã Duyệt: không nghiên cứu lại, sửa trực tiếp hồ sơ.
    expect(await researchInspiration({ inspirationId: i.id })).toEqual({
      ok: false,
      error: "Hồ sơ nghiên cứu của Cảm hứng đã duyệt. Sửa trực tiếp trên hồ sơ.",
    });
  });

  it("Duyệt bản sửa sai schema → lỗi tại trường, không ghi hồ sơ", async () => {
    const i = await inspiration();
    const view = await researched(i.id);
    const res = await approveSuggestion({ id: view!.id, payload: { ...view!.payload!, keywords: [{ id: "tu-khoa-1", text: " " }] } });
    expect(res).toEqual({ ok: false, error: "Nhập từ khoá" });
    expect(await db.researchProfile.count()).toBe(0);
  });

  it("Từ chối → REJECTED; Tạo lại sau đó được", async () => {
    const i = await inspiration();
    const view = await researched(i.id);
    expect((await rejectSuggestion({ id: view!.id })).ok).toBe(true);
    expect((await getInspirationSuggestionForCms(i.id))?.status).toBe("REJECTED");
    fakeAi.reply(aiReply());
    expect((await researchInspiration({ inspirationId: i.id })).ok).toBe(true);
  });
});

describe("Bộ nội dung từ Cảm hứng (FR-2, UJ-2)", () => {
  const PROFILE = {
    info: [],
    infoNote: null,
    imageDescription: null,
    reviewSummary: null,
    audiences: [{ id: "doc-gia-1", name: "Sinh viên", reason: "Phòng nhỏ" }],
    angles: [
      { id: "goc-viet-1", name: "Gấp nhanh", hook: "Một phút gấp xong" },
      { id: "goc-viet-2", name: "Gọn", hook: "Tủ gọn" },
      { id: "goc-viet-3", name: "Rẻ", hook: "Vài chục nghìn" },
    ],
  };

  async function productWithProfile() {
    const p = await db.product.create({ data: { name: "Bảng gấp áo", affiliateUrl: "https://s.shopee.vn/a" } });
    await db.researchProfile.create({ data: { productId: p.id, data: PROFILE } });
    return p;
  }

  const input = (productId: string, inspirationId: string | null) => ({
    productIds: [productId],
    angle: { productId, id: "goc-viet-1" },
    audience: { productId, id: "doc-gia-1" },
    platforms: ["WEBSITE" as const],
    inspirationId,
  });

  it("tạo bộ mở kèm ?cam-hung → ContentSet.inspirationId được ghi; Cảm hứng thành Đã dùng", async () => {
    const i = await inspiration();
    const p = await productWithProfile();
    const res = await createContentSet(input(p.id, i.id));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect((await db.contentSet.findUniqueOrThrow({ where: { id: res.contentSetId } })).inspirationId).toBe(i.id);
    const used = await listInspirationsForCms({ filter: "USED", page: 1 });
    expect(used.items.map((x) => [x.id, x.status])).toEqual([[i.id, "USED"]]);
  });

  it("không kèm Cảm hứng → bộ không có liên kết", async () => {
    const p = await productWithProfile();
    const res = await createContentSet(input(p.id, null));
    if (!res.ok) throw new Error(res.error);
    expect((await db.contentSet.findUniqueOrThrow({ where: { id: res.contentSetId } })).inspirationId).toBeNull();
  });

  it("Cảm hứng đã bị xoá → lỗi tiếng Việt, không tạo bộ", async () => {
    const p = await productWithProfile();
    const res = await createContentSet(input(p.id, "khong-co"));
    expect(res).toEqual({ ok: false, error: "Không tìm thấy Cảm hứng. Có thể đã bị xoá." });
    expect(await db.contentSet.count()).toBe(0);
  });
});
