import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { createPost, deletePost, savePost } from "@/app/cms/actions";
import type { PostInput } from "@/lib/post-input";

// Server Action cũ của trình soạn bài (ngoại lệ AD-17 Story 2.3): không bao giờ ghi Sản phẩm.

async function postWithProducts() {
  const category = await db.category.create({ data: { name: "Nhà bếp", slug: "nha-bep" } });
  const products = [];
  for (const [i, name] of ["Nồi", "Chảo", "Bát"].entries()) {
    products.push(
      await db.product.create({
        data: {
          name,
          affiliateUrl: `https://s.shopee.vn/${i}`,
          priceText: `~${i + 1}0.000đ`,
          priceUpdatedAt: new Date("2026-01-01T00:00:00Z"),
          categoryId: category.id,
        },
      }),
    );
  }
  const post = await db.post.create({
    data: {
      title: "Bài cũ",
      slug: "bai-cu",
      content: "<p>x</p>",
      postType: "GOM_LINK",
      postProducts: { create: products.map((p, sortOrder) => ({ productId: p.id, sortOrder: 2 - sortOrder })) },
    },
  });
  return post;
}

const snapshot = async () => ({
  products: await db.product.findMany({ orderBy: { id: "asc" } }),
  postProducts: await db.postProduct.findMany({ orderBy: { id: "asc" } }),
});

const input: PostInput = {
  title: "Bài đã sửa",
  slug: "",
  excerpt: "",
  featuredImage: "",
  category: "MEO_VAT",
  categoryId: "",
  content: "<p>Mới</p>",
  tags: [],
  seoTitle: "",
  seoDescription: "",
  seoKeywords: [],
};

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => db.$disconnect());

describe("savePost", () => {
  it("lưu bài giữ nguyên PostProduct và Sản phẩm (id, thứ tự, mọi cột)", async () => {
    const post = await postWithProducts();
    const before = await snapshot();

    const res = await savePost(post.id, input);

    expect(res).toEqual({ ok: true, slug: "bai-da-sua" });
    expect(await snapshot()).toEqual(before);
    expect(actionTest.updatedTags).toEqual(["posts", "categories"]);
  });

  it("gán, đổi và bỏ Danh mục của bài", async () => {
    const post = await postWithProducts();
    const other = await db.category.create({ data: { name: "Làm đẹp", slug: "lam-dep" } });
    expect((await savePost(post.id, { ...input, categoryId: other.id })).ok).toBe(true);
    expect((await db.post.findUniqueOrThrow({ where: { id: post.id } })).categoryId).toBe(other.id);
    expect((await savePost(post.id, { ...input, categoryId: "" })).ok).toBe(true);
    expect((await db.post.findUniqueOrThrow({ where: { id: post.id } })).categoryId).toBeNull();
  });

  it("Danh mục không tồn tại báo UserError, không đổi bài", async () => {
    const post = await postWithProducts();
    expect(await savePost(post.id, { ...input, categoryId: "7f3c2a8e-1b4d-4c6e-9f0a-2b3c4d5e6f70" })).toEqual({
      ok: false,
      error: "Danh mục đã chọn không còn tồn tại. Tải lại trang rồi chọn lại.",
    });
    expect(await db.post.findUniqueOrThrow({ where: { id: post.id } })).toMatchObject({ title: "Bài cũ" });
  });

  it("chưa đăng nhập thì từ chối, không ghi gì", async () => {
    const post = await postWithProducts();
    actionTest.authorization = null;

    expect(await savePost(post.id, input)).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
    expect(await db.post.findUniqueOrThrow({ where: { id: post.id } })).toMatchObject({ title: "Bài cũ" });
    expect(actionTest.updatedTags).toEqual([]);
  });
});

describe("deletePost", () => {
  it("xoá bài và PostProduct của nó, Sản phẩm còn nguyên", async () => {
    const post = await postWithProducts();
    const { products } = await snapshot();

    expect(await deletePost(post.id)).toEqual({ ok: true });
    expect(actionTest.updatedTags).toEqual(["posts", "categories"]);

    expect(await db.post.count()).toBe(0);
    expect(await db.postProduct.count()).toBe(0);
    expect(await db.product.findMany({ orderBy: { id: "asc" } })).toEqual(products);
  });
});

describe("createPost", () => {
  it("AI không có chủ đề báo UserError, không tạo bài", async () => {
    expect(await createPost({ category: "MEO_VAT", categoryId: "", topic: "  ", useAi: true })).toEqual({
      ok: false,
      error: "Nhập chủ đề để AI viết bài",
    });
    expect(await db.post.count()).toBe(0);
  });

  it("bản nháp trống ghi Danh mục đã chọn", async () => {
    const c = await db.category.create({ data: { name: "Nhà bếp", slug: "nha-bep" } });
    const res = await createPost({ category: "MEO_VAT", categoryId: c.id, topic: "Mẹo bếp", useAi: false });
    expect(res.ok).toBe(true);
    expect(await db.post.findFirstOrThrow()).toMatchObject({ title: "Mẹo bếp", categoryId: c.id, status: "DRAFT" });
  });
});
