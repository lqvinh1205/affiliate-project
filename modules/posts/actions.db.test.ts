import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { deletePost, savePost, setPostStatus } from "@/modules/posts/actions";
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

  it("bài chưa có nội dung không xuất bản được", async () => {
    const p = await post({ content: "  " });
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

  it("chưa đăng nhập thì từ chối", async () => {
    const p = await post();
    actionTest.authorization = null;
    expect(await deletePost({ id: p.id })).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
    expect(await db.post.count()).toBe(1);
  });
});
