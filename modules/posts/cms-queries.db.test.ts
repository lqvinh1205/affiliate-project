import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { listCategoriesForCms, listPostsUsingProductForCms } from "@/modules/posts/cms-queries";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

describe("listCategoriesForCms", () => {
  it("trả Danh mục theo thứ tự hiển thị kèm số Bài web và Sản phẩm", async () => {
    const b = await db.category.create({ data: { name: "B", slug: "b", sortOrder: 1 } });
    await db.category.create({ data: { name: "A", slug: "a", sortOrder: 0 } });
    await db.post.create({ data: { title: "x", slug: "x", content: "", postType: "MEO_VAT", categoryId: b.id } });
    await db.product.create({ data: { name: "p", affiliateUrl: "https://shopee.vn/p", categoryId: b.id } });
    await db.product.create({ data: { name: "q", affiliateUrl: "https://shopee.vn/q", categoryId: b.id } });

    const list = await listCategoriesForCms();
    expect(list.map((c) => [c.name, c._count.posts, c._count.products])).toEqual([
      ["A", 0, 0],
      ["B", 1, 2],
    ]);
  });
});

async function postWith(title: string, productIds: string[]) {
  return db.post.create({
    data: {
      title,
      slug: title,
      content: "",
      postType: "MEO_VAT",
      postProducts: { create: productIds.map((productId, sortOrder) => ({ productId, sortOrder })) },
    },
  });
}

describe("listPostsUsingProductForCms", () => {
  it("trả các Bài web gắn Sản phẩm, theo tiêu đề", async () => {
    const p = await db.product.create({ data: { name: "p", affiliateUrl: "https://shopee.vn/p" } });
    const other = await db.product.create({ data: { name: "q", affiliateUrl: "https://shopee.vn/q" } });
    const b = await postWith("b-bai", [p.id]);
    const a = await postWith("a-bai", [other.id, p.id]);
    await postWith("c-bai", [other.id]);

    expect(await listPostsUsingProductForCms(p.id)).toEqual([
      { id: a.id, title: "a-bai", status: "DRAFT" },
      { id: b.id, title: "b-bai", status: "DRAFT" },
    ]);
  });

  it("Sản phẩm chưa gắn bài nào trả rỗng", async () => {
    const p = await db.product.create({ data: { name: "p", affiliateUrl: "https://shopee.vn/p" } });
    expect(await listPostsUsingProductForCms(p.id)).toEqual([]);
  });
});

describe("xoá Bài web", () => {
  it("xoá bài và PostProduct của nó, Sản phẩm còn nguyên (FR-4)", async () => {
    const p = await db.product.create({ data: { name: "p", affiliateUrl: "https://shopee.vn/p", priceText: "~1đ" } });
    const post = await postWith("bai", [p.id]);
    await db.post.delete({ where: { id: post.id } });

    expect(await db.postProduct.count()).toBe(0);
    expect(await db.product.findUnique({ where: { id: p.id } })).toMatchObject({ name: "p", priceText: "~1đ" });
  });
});
