import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { INVALID_INPUT_ERROR, RATE_LIMITED_ERROR } from "@/platform/errors";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { createPostDraft, savePost, searchPosts } from "@/modules/posts/actions";
import { SEARCH_RATE_LIMIT, SEARCH_RESULTS_LIMIT } from "@/modules/posts/constants";
import { applyWebPostSuggestionRecord } from "@/modules/posts/service";

// Tìm kiếm không dấu (FR-36, Story 8.3): cột `Post.searchText` ghi ở mọi lần ghi bài; action công khai `searchPosts`.

// Bộ giới hạn tần suất của action sống suốt file test: mỗi test một IP riêng để không ảnh hưởng nhau.
let ipSeq = 0;
function asReader() {
  ipSeq += 1;
  actionTest.authorization = null; // người đọc không đăng nhập
  actionTest.requestHeaders = { "user-agent": "Mozilla/5.0", "x-forwarded-for": `203.0.113.${ipSeq}` };
}

let day = 0;
async function publish(title: string, data: { status?: "DRAFT" | "PUBLISHED"; searchText?: string } = {}) {
  day += 1;
  const status = data.status ?? "PUBLISHED";
  return db.post.create({
    data: {
      title,
      slug: `bai-${day}`,
      content: "<p>x</p>",
      postType: "MEO_VAT",
      status,
      publishedAt: status === "PUBLISHED" ? new Date(Date.UTC(2026, 0, day)) : null,
      searchText: data.searchText ?? title,
    },
  });
}

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => db.$disconnect());

describe("Post.searchText ghi khi lưu bài", () => {
  const form = {
    slug: "",
    excerpt: "Tẩy vết ố trong 5 phút",
    featuredImage: "",
    postType: "MEO_VAT" as const,
    categoryId: "",
    content: "<h2>Bước một</h2><p>Dùng <strong>giấm</strong>&nbsp;trắng</p>",
    tags: "Nhà bếp, Đồ gia dụng",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  };

  it("createPostDraft và savePost ghi tiêu đề, tóm tắt, thẻ, chữ thân bài — bỏ dấu, chữ thường", async () => {
    const created = await createPostDraft({ ...form, title: "Nồi chiên KHÔNG dầu" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect((await db.post.findUniqueOrThrow({ where: { id: created.id } })).searchText).toBe(
      "noi chien khong dau tay vet o trong 5 phut nha bep do gia dung buoc mot dung giam trang",
    );

    await savePost({ ...form, id: created.id, slug: created.slug, title: "Máy hút bụi", tags: "", productIds: [] });
    expect((await db.post.findUniqueOrThrow({ where: { id: created.id } })).searchText).toBe(
      "may hut bui tay vet o trong 5 phut buoc mot dung giam trang",
    );
  });

  it("thực thể HTML sanitize-html viết ra (&amp; &quot; &lt;) không thành từ tìm được", async () => {
    const created = await createPostDraft({ ...form, excerpt: "", tags: "", title: "Mẹo", content: '<p>Mẹo "hay" & rẻ <3</p>' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect((await db.post.findUniqueOrThrow({ where: { id: created.id } })).searchText).toBe("meo meo hay re 3");
  });

  it("Duyệt gợi ý Bài web (tạo mới và ghi vào bài nháp) cũng ghi searchText", async () => {
    const payload = {
      title: "Đồ xinh cho bếp",
      excerpt: "",
      content: "<p>Kệ gia vị</p>",
      tags: ["Bếp"],
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
      postType: "GOM_LINK" as const,
      categoryId: null,
      categoryName: null,
    };
    const created = await applyWebPostSuggestionRecord({ postId: null, payload, productIds: [] });
    expect((await db.post.findUniqueOrThrow({ where: { id: created!.id } })).searchText).toBe("do xinh cho bep bep ke gia vi");

    await applyWebPostSuggestionRecord({ postId: created!.id, payload: { ...payload, title: "Ấm siêu tốc" }, productIds: [] });
    expect((await db.post.findUniqueOrThrow({ where: { id: created!.id } })).searchText).toBe("am sieu toc bep ke gia vi");
  });
});

describe("searchPosts (action công khai chỉ đọc — AD-6 ngoại lệ số 2)", () => {
  it("gõ không dấu tìm được bài có dấu; mọi từ phải khớp; chỉ bài đã xuất bản; mới nhất trước; không updateTag", async () => {
    const older = await publish("Mẹo dùng nồi chiên", { searchText: "meo dung noi chien" });
    const newer = await publish("Nồi chiên không dầu", { searchText: "noi chien khong dau" });
    await publish("Nồi cơm điện", { searchText: "noi com dien" });
    await publish("Nồi chiên nháp", { status: "DRAFT", searchText: "noi chien nhap" });
    asReader();

    const res = await searchPosts({ q: "  NOI   chiên " });
    expect(res).toMatchObject({ ok: true, total: 2, terms: ["noi", "chien"] });
    if (!res.ok) return;
    expect(res.items.map((p) => p.slug)).toEqual([newer.slug, older.slug]);
    // Ngày đăng qua ranh giới client là chuỗi ISO (AD-8); thẻ đủ cột của PostCard.
    expect(res.items[0]).toMatchObject({ title: "Nồi chiên không dầu", publishedAt: newer.publishedAt!.toISOString() });
    expect(res.items[0]).toHaveProperty("readingMinutes");
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("không có bài khớp: total 0", async () => {
    await publish("Mẹo giặt", { searchText: "meo giat" });
    asReader();
    expect(await searchPosts({ q: "tủ lạnh" })).toEqual({ ok: true, total: 0, terms: ["tu", "lanh"], items: [] });
  });

  it(`trả tối đa ${SEARCH_RESULTS_LIMIT} bài nhưng đếm đủ tổng`, async () => {
    for (let i = 0; i < SEARCH_RESULTS_LIMIT + 2; i++) await publish(`Mẹo ${i}`, { searchText: `meo ${i}` });
    asReader();
    const res = await searchPosts({ q: "meo" });
    expect(res.ok && [res.items.length, res.total]).toEqual([SEARCH_RESULTS_LIMIT, SEARCH_RESULTS_LIMIT + 2]);
  });

  it.each([
    ["1 ký tự", "a"],
    ["chỉ ký tự lạ / ký tự đại diện của LIKE", "%_%"],
    ["quá 100 ký tự", "a".repeat(101)],
  ])("từ khoá không hợp lệ (%s): lỗi dữ liệu", async (_, q) => {
    asReader();
    expect(await searchPosts({ q })).toEqual({ ok: false, error: INVALID_INPUT_ERROR });
  });

  it(`giới hạn ${SEARCH_RATE_LIMIT.limit} lần/phút mỗi nguồn; nguồn khác vẫn tìm được`, async () => {
    asReader();
    for (let i = 0; i < SEARCH_RATE_LIMIT.limit; i++) expect((await searchPosts({ q: "meo" })).ok).toBe(true);
    expect(await searchPosts({ q: "meo" })).toEqual({ ok: false, error: RATE_LIMITED_ERROR });
    asReader();
    expect((await searchPosts({ q: "meo" })).ok).toBe(true);
  });

  it("không ghi log (từ khoá, định danh) kể cả khi lỗi bất ngờ", async () => {
    asReader();
    const spy = vi.spyOn(db.post, "findMany").mockRejectedValueOnce(new Error("DB hỏng"));
    expect(await searchPosts({ q: "meo" })).toMatchObject({ ok: false });
    expect(console.error).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
