import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { AI_BAD_OUTPUT } from "@/platform/ai/ask";
import { fakeAi } from "@/platform/ai/providers/fake";
import { checkPostSeo, createPost, createPostDraft, deletePost, savePost, setPostStatus } from "@/modules/posts/actions";
import type { PostFormValues } from "@/modules/posts/schema";

async function product(name: string, data: { hidden?: boolean } = {}) {
  return db.product.create({
    data: { name, affiliateUrl: `https://s.shopee.vn/${encodeURIComponent(name)}`, priceText: "~10.000đ", ...data },
  });
}

async function post(data: { slug?: string; status?: "DRAFT" | "PUBLISHED"; productIds?: string[]; content?: string } = {}) {
  const published = data.status === "PUBLISHED";
  return db.post.create({
    data: {
      title: "Bài cũ",
      slug: data.slug ?? "bai-cu",
      content: data.content ?? "<p>x</p>",
      postType: "GOM_LINK",
      status: data.status ?? "DRAFT",
      publishedAt: published ? new Date("2026-01-01T00:00:00Z") : null,
      postProducts: { create: (data.productIds ?? []).map((productId, sortOrder) => ({ productId, sortOrder })) },
    },
  });
}

function input(id: string, patch: Partial<PostFormValues> = {}): PostFormValues {
  return {
    id,
    title: "Bài đã sửa",
    slug: "bai-cu",
    excerpt: "",
    featuredImage: "",
    postType: "MEO_VAT",
    categoryId: "",
    content: "<p>Mới</p>",
    tags: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    productIds: [],
    ...patch,
  };
}

const order = async (postId: string) =>
  (await db.postProduct.findMany({ where: { postId }, orderBy: { sortOrder: "asc" }, select: { productId: true } })).map(
    (r) => r.productId,
  );

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => db.$disconnect());

describe("savePost", () => {
  it("lưu bài, sanitize thân bài, làm mới tag posts + categories", async () => {
    const p = await post();
    const res = await savePost(
      input(p.id, { content: '<h2>A</h2><p><a href="https://x.vn">b</a><img src="y"></p><table><tr><td>c</td></tr></table>' }),
    );
    expect(res).toEqual({ ok: true, id: p.id, slug: "bai-cu" });
    const saved = await db.post.findUniqueOrThrow({ where: { id: p.id } });
    expect(saved).toMatchObject({ title: "Bài đã sửa", postType: "MEO_VAT" });
    expect(saved.content).not.toMatch(/<(a|img|table|td)\b/);
    expect(actionTest.updatedTags).toEqual(["posts", "categories"]);
  });

  it("thẻ, từ khoá nhập cách nhau bằng dấu phẩy lưu thành mảng", async () => {
    const p = await post();
    await savePost(input(p.id, { tags: "bếp, mẹo vặt, bếp,", seoKeywords: " nồi chiên " }));
    expect(await db.post.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({
      tags: ["bếp", "mẹo vặt"],
      seoKeywords: ["nồi chiên"],
    });
  });

  it("gắn Sản phẩm theo thứ tự, đổi thứ tự, gỡ — Sản phẩm trong Kho không đổi (FR-4)", async () => {
    const [a, b, c] = [await product("A"), await product("B"), await product("C")];
    const p = await post();
    const kho = await db.product.findMany({ orderBy: { id: "asc" } });

    expect((await savePost(input(p.id, { productIds: [c.id, a.id, b.id] }))).ok).toBe(true);
    expect(await order(p.id)).toEqual([c.id, a.id, b.id]);

    expect((await savePost(input(p.id, { productIds: [b.id, c.id] }))).ok).toBe(true);
    expect(await order(p.id)).toEqual([b.id, c.id]);

    expect(await db.product.findMany({ orderBy: { id: "asc" } })).toEqual(kho);
  });

  it("không gắn mới được Sản phẩm đang ẩn; Sản phẩm ẩn đã gắn từ trước thì giữ được", async () => {
    const hidden = await product("Ẩn", { hidden: true });
    const visible = await product("Hiện");
    const p = await post();
    expect(await savePost(input(p.id, { productIds: [hidden.id] }))).toEqual({
      ok: false,
      error: "Có Sản phẩm vừa bị ẩn hoặc không còn trong Kho. Gỡ nó khỏi bài rồi lưu lại.",
    });
    expect(await order(p.id)).toEqual([]);

    const old = await post({ slug: "bai-khac", productIds: [hidden.id] });
    expect((await savePost(input(old.id, { slug: "bai-khac", productIds: [visible.id, hidden.id] }))).ok).toBe(true);
    expect(await order(old.id)).toEqual([visible.id, hidden.id]);
  });

  it("Sản phẩm không tồn tại báo lỗi, không ghi", async () => {
    const p = await post();
    expect((await savePost(input(p.id, { productIds: ["khong-co"] }))).ok).toBe(false);
    expect(await db.post.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({ title: "Bài cũ" });
  });

  it("slug trùng bài khác báo UserError; slug trống tạo từ tiêu đề", async () => {
    await post({ slug: "da-co" });
    const p = await post();
    expect(await savePost(input(p.id, { slug: "da-co" }))).toEqual({
      ok: false,
      error: "Đường dẫn đã được bài khác dùng. Chọn đường dẫn khác.",
    });
    expect(actionTest.updatedTags).toEqual([]);
    expect(await savePost(input(p.id, { slug: "" }))).toMatchObject({ ok: true, slug: "bai-da-sua" });
  });

  it("slug sai dạng báo lỗi tại trường", async () => {
    const p = await post();
    expect(await savePost(input(p.id, { slug: "Bài Cũ" }))).toMatchObject({ ok: false });
  });

  it("Danh mục không tồn tại báo UserError, không đổi bài", async () => {
    const p = await post();
    expect(await savePost(input(p.id, { categoryId: "7f3c2a8e-1b4d-4c6e-9f0a-2b3c4d5e6f70" }))).toEqual({
      ok: false,
      error: "Danh mục đã chọn không còn tồn tại. Tải lại trang rồi chọn lại.",
    });
    expect(await db.post.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({ title: "Bài cũ" });
  });

  it("bài không tồn tại báo lỗi tiếng Việt", async () => {
    expect(await savePost(input("khong-co"))).toEqual({ ok: false, error: "Không tìm thấy Bài web. Có thể đã bị xoá." });
  });

  it("bài đang xuất bản không lưu được thân bài rỗng (kể cả chỉ thẻ rỗng)", async () => {
    const p = await post({ status: "PUBLISHED" });
    expect(await savePost(input(p.id, { content: "<p></p><p> </p>" }))).toEqual({
      ok: false,
      error: "Bài đang xuất bản không được để trống thân bài. Viết nội dung hoặc chuyển bài về nháp trước.",
    });
    expect((await savePost(input((await post({ slug: "nhap" })).id, { slug: "nhap", content: "<p></p>" }))).ok).toBe(true);
  });

  it("chưa đăng nhập thì từ chối, không ghi gì", async () => {
    const p = await post();
    actionTest.authorization = null;
    expect(await savePost(input(p.id))).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
    expect(await db.post.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({ title: "Bài cũ" });
    expect(actionTest.updatedTags).toEqual([]);
  });
});

describe("đổi slug bài đã xuất bản (FR-27, AD-20)", () => {
  it("bài đã xuất bản đổi a → b → c: mọi slug cũ trỏ tới bài, slug cuối là c", async () => {
    const p = await post({ slug: "a", status: "PUBLISHED" });
    await savePost(input(p.id, { slug: "b" }));
    await savePost(input(p.id, { slug: "c" }));
    const redirects = await db.postSlugRedirect.findMany({ orderBy: { oldSlug: "asc" }, select: { oldSlug: true, postId: true } });
    expect(redirects).toEqual([
      { oldSlug: "a", postId: p.id },
      { oldSlug: "b", postId: p.id },
    ]);
  });

  it("quay lại slug cũ thì bỏ bản ghi trùng; bài chưa từng xuất bản không ghi lịch sử", async () => {
    const p = await post({ slug: "a", status: "PUBLISHED" });
    await savePost(input(p.id, { slug: "b" }));
    await savePost(input(p.id, { slug: "a" }));
    expect((await db.postSlugRedirect.findMany()).map((r) => r.oldSlug)).toEqual(["b"]);

    const draft = await post({ slug: "nhap" });
    await savePost(input(draft.id, { slug: "nhap-2" }));
    expect(await db.postSlugRedirect.count({ where: { postId: draft.id } })).toBe(0);
  });

  it("không lấy slug cũ còn chuyển hướng của bài khác", async () => {
    const a = await post({ slug: "a", status: "PUBLISHED" });
    await savePost(input(a.id, { slug: "a-moi" }));
    const b = await post({ slug: "b" });
    expect(await savePost(input(b.id, { slug: "a" }))).toMatchObject({ ok: false });
  });
});

describe("setPostStatus", () => {
  it("xuất bản rồi chuyển về nháp, giữ ngày đăng gốc; làm mới tag", async () => {
    const p = await post();
    expect(await setPostStatus({ id: p.id, status: "PUBLISHED" })).toMatchObject({ ok: true, status: "PUBLISHED" });
    const first = (await db.post.findUniqueOrThrow({ where: { id: p.id } })).publishedAt;
    expect(first).not.toBeNull();
    expect(actionTest.updatedTags).toEqual(["posts", "categories"]);

    expect(await setPostStatus({ id: p.id, status: "DRAFT" })).toMatchObject({ ok: true, status: "DRAFT" });
    await setPostStatus({ id: p.id, status: "PUBLISHED" });
    expect((await db.post.findUniqueOrThrow({ where: { id: p.id } })).publishedAt).toEqual(first);
  });

  it("bài chưa có chữ nào (chỉ thẻ rỗng) không xuất bản được", async () => {
    const p = await post({ content: "<p></p>" });
    expect(await setPostStatus({ id: p.id, status: "PUBLISHED" })).toEqual({
      ok: false,
      error: "Bài chưa có nội dung, chưa thể xuất bản",
    });
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("bài không tồn tại báo lỗi tiếng Việt", async () => {
    expect(await setPostStatus({ id: "khong-co", status: "PUBLISHED" })).toEqual({
      ok: false,
      error: "Không tìm thấy Bài web. Có thể đã bị xoá.",
    });
  });
});

describe("deletePost", () => {
  it("xoá bài, PostProduct và lịch sử slug của nó; Sản phẩm còn nguyên (FR-4)", async () => {
    const a = await product("A");
    const p = await post({ slug: "a", status: "PUBLISHED", productIds: [a.id] });
    await savePost(input(p.id, { slug: "b", productIds: [a.id] }));
    const kho = await db.product.findMany();

    expect(await deletePost({ id: p.id })).toEqual({ ok: true });
    expect(actionTest.updatedTags).toEqual(["posts", "categories", "posts", "categories"]);
    expect(await db.post.count()).toBe(0);
    expect(await db.postProduct.count()).toBe(0);
    expect(await db.postSlugRedirect.count()).toBe(0);
    expect(await db.product.findMany()).toEqual(kho);
  });

  it("bài đã bị xoá thì coi như xong", async () => {
    expect(await deletePost({ id: "khong-co" })).toEqual({ ok: true });
  });

  it("chưa đăng nhập thì từ chối", async () => {
    const p = await post();
    actionTest.authorization = null;
    expect(await deletePost({ id: p.id })).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
    expect(await db.post.count()).toBe(1);
  });
});

describe("createPostDraft", () => {
  const draft = {
    title: "Mẹo bếp",
    slug: "",
    excerpt: "",
    featuredImage: "",
    postType: "MEO_VAT" as const,
    categoryId: "",
    content: '<p>x</p><table><tr><td>y</td></tr></table>',
    tags: "a, b",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  };

  it("tạo bài nháp, slug tự tạo không trùng slug cũ của bài khác, thân bài đã sanitize, không làm mới cache", async () => {
    const other = await post({ slug: "x" });
    await db.postSlugRedirect.create({ data: { oldSlug: "meo-bep", postId: other.id } });
    const res = await createPostDraft(draft);
    expect(res).toMatchObject({ ok: true, slug: "meo-bep-2" });
    const saved = await db.post.findFirstOrThrow({ where: { title: "Mẹo bếp" } });
    expect(saved).toMatchObject({ status: "DRAFT", tags: ["a", "b"] });
    expect(saved.content).not.toContain("<table");
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("tiêu đề dài tạo slug không quá giới hạn kể cả có hậu tố", async () => {
    const title = "a".repeat(200);
    const first = await createPostDraft({ ...draft, title });
    const second = await createPostDraft({ ...draft, title });
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.slug.length).toBeLessThanOrEqual(200);
      expect(second.slug.length).toBeLessThanOrEqual(200);
      expect(second.slug.endsWith("-2")).toBe(true);
    }
  });

  it("Danh mục không tồn tại báo UserError", async () => {
    expect(await createPostDraft({ ...draft, categoryId: "7f3c2a8e-1b4d-4c6e-9f0a-2b3c4d5e6f70" })).toEqual({
      ok: false,
      error: "Danh mục đã chọn không còn tồn tại. Tải lại trang rồi chọn lại.",
    });
  });
});

// Chuyển từ `app/cms/actions.db.test.ts` (Story 4.1): `createPost` nay ở `modules/posts/actions.ts`, nhánh AI chạy
// trên `platform/ai` giả lập (AD-16).
describe("createPost", () => {
  it("AI không có chủ đề báo UserError, không tạo bài, không gọi AI", async () => {
    expect(await createPost({ postType: "MEO_VAT", categoryId: "", topic: "  ", useAi: true })).toEqual({
      ok: false,
      error: "Nhập chủ đề để AI viết bài",
    });
    expect(await db.post.count()).toBe(0);
    expect(fakeAi.calls()).toHaveLength(0);
  });

  it("bản nháp trống ghi Danh mục đã chọn", async () => {
    const c = await db.category.create({ data: { name: "Nhà bếp", slug: "nha-bep" } });
    const res = await createPost({ postType: "MEO_VAT", categoryId: c.id, topic: "Mẹo bếp", useAi: false });
    expect(res.ok).toBe(true);
    expect(await db.post.findFirstOrThrow()).toMatchObject({ title: "Mẹo bếp", categoryId: c.id, status: "DRAFT" });
  });

  it("chủ đề dài quá giới hạn tiêu đề bị từ chối tại trường", async () => {
    expect(await createPost({ postType: "MEO_VAT", categoryId: "", topic: "a".repeat(201), useAi: false })).toEqual({
      ok: false,
      error: "Tối đa 200 ký tự",
    });
  });

  it("AI viết bản nháp: chuẩn hoá về giới hạn Bài web, thân bài sanitize, là nháp, không làm mới cache", async () => {
    fakeAi.reply(() => ({
      title: "t".repeat(300),
      excerpt: "Tóm tắt",
      seoTitle: "SEO",
      seoDescription: "Mô tả",
      content: "<h2>Mục</h2><p>x</p><a href='https://x.vn'>link</a>",
      tags: ["bếp", "Bếp", "mẹo, hay"],
      seoKeywords: ["mẹo bếp"],
    }));
    const res = await createPost({ postType: "MEO_VAT", categoryId: "", topic: "Mẹo bếp", useAi: true });
    expect(res.ok).toBe(true);
    const saved = await db.post.findFirstOrThrow();
    expect(saved.title).toHaveLength(200);
    expect(saved).toMatchObject({ status: "DRAFT", tags: ["bếp", "mẹo hay"], seoKeywords: ["mẹo bếp"] });
    expect(saved.content).not.toContain("<a");
    expect(fakeAi.calls()[0]).toMatchObject({ profile: "quality", webSearch: false });
    expect(fakeAi.calls()[0].user).toContain("Chủ đề/ý tưởng: Mẹo bếp");
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("AI trả sai định dạng hai lần: báo UserError tiếng Việt, không tạo bài", async () => {
    fakeAi.reply(() => ({ sai: true }));
    expect(await createPost({ postType: "GOM_LINK", categoryId: "", topic: "Đồ xinh", useAi: true })).toEqual({
      ok: false,
      error: AI_BAD_OUTPUT,
    });
    expect(await db.post.count()).toBe(0);
  });
});

describe("checkPostSeo", () => {
  const seoInput = { title: "Mẹo bếp", seoTitle: "", seoDescription: "", content: "<p>x</p>", keywords: ["mẹo bếp"] };

  it("trả điểm đã kẹp 0–100 và gợi ý; không lưu, không tạo Suggestion, không làm mới cache (AD-9)", async () => {
    fakeAi.reply(() => ({ score: 123.4, suggestions: [" Thêm từ khoá vào h2 ", ""] }));
    expect(await checkPostSeo(seoInput)).toEqual({
      ok: true,
      report: { score: 100, suggestions: ["Thêm từ khoá vào h2"] },
    });
    expect(fakeAi.calls()[0]).toMatchObject({ profile: "fast" });
    expect(fakeAi.calls()[0].user).toContain("Từ khoá mục tiêu: mẹo bếp");
    expect(await db.suggestion.count()).toBe(0);
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("chưa đăng nhập bị chặn, không gọi AI", async () => {
    actionTest.authorization = null;
    expect(await checkPostSeo(seoInput)).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
    expect(fakeAi.calls()).toHaveLength(0);
  });
});
