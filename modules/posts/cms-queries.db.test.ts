import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { CMS_POST_PAGE_SIZE } from "@/modules/posts/constants";
import {
  getPostForCms,
  listCategoriesForCms,
  listPostsForCms,
  listPostsUsingProductForCms,
} from "@/modules/posts/cms-queries";

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

describe("listPostsForCms", () => {
  it("lọc trạng thái và tiêu đề, sửa gần nhất trước, kẹp trang", async () => {
    await db.post.create({ data: { title: "Nồi chiên", slug: "a", content: "", postType: "MEO_VAT" } });
    await db.post.create({
      data: { title: "Mẹo nồi cơm", slug: "b", content: "x", postType: "MEO_VAT", status: "PUBLISHED", publishedAt: new Date() },
    });
    await db.post.create({ data: { title: "Chảo", slug: "c", content: "", postType: "GOM_LINK" } });

    const all = await listPostsForCms({ status: null, q: "", page: 1 });
    expect(all.items.map((p) => p.title)).toEqual(["Chảo", "Mẹo nồi cơm", "Nồi chiên"]);
    const titles = async (f: Parameters<typeof listPostsForCms>[0]) => (await listPostsForCms(f)).items.map((p) => p.title);
    expect(await titles({ status: "DRAFT", q: "", page: 1 })).toEqual(["Chảo", "Nồi chiên"]);
    expect(await titles({ status: "PUBLISHED", q: "", page: 1 })).toEqual(["Mẹo nồi cơm"]);
    expect(await titles({ status: null, q: "NỒI", page: 1 })).toEqual(["Mẹo nồi cơm", "Nồi chiên"]);
    expect(await listPostsForCms({ status: "PUBLISHED", q: "chảo", page: 1 })).toEqual({ items: [], total: 0, page: 1 });
    expect((await listPostsForCms({ status: null, q: "", page: 99 })).page).toBe(1);
  });

  it(`phân trang ${CMS_POST_PAGE_SIZE} bài mỗi trang`, async () => {
    for (let i = 0; i < CMS_POST_PAGE_SIZE + 1; i++) {
      await db.post.create({ data: { title: `b${i}`, slug: `b${i}`, content: "", postType: "MEO_VAT" } });
    }
    const p2 = await listPostsForCms({ status: null, q: "", page: 2 });
    expect([p2.total, p2.page, p2.items.length]).toEqual([CMS_POST_PAGE_SIZE + 1, 2, 1]);
  });
});

describe("getPostForCms", () => {
  it("trả bài kèm Sản phẩm theo thứ tự, cả Sản phẩm đang ẩn", async () => {
    const a = await db.product.create({ data: { name: "A", affiliateUrl: "https://shopee.vn/a", hidden: true } });
    const b = await db.product.create({ data: { name: "B", affiliateUrl: "https://shopee.vn/b" } });
    const post = await postWith("bai", [b.id, a.id]);
    const got = await getPostForCms(post.id);
    expect(got?.postProducts.map((pp) => [pp.product.name, pp.product.hidden])).toEqual([
      ["B", false],
      ["A", true],
    ]);
    expect(await getPostForCms("khong-co")).toBeNull();
  });
});
