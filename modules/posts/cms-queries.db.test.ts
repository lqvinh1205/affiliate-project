import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { listCategoriesForCms } from "@/modules/posts/cms-queries";

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
