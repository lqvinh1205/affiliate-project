import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { cacheTagsOf, resetTestDb } from "@/vitest.db.helpers";
import { PAGE_SIZE } from "@/modules/posts/constants";
import {
  getLatestPosts,
  getPostBySlug,
  getPostsByType,
  getPostSlugRedirect,
  getRelatedPosts,
  isPublicPostSlug,
  listCategoriesWithPostCounts,
  listNavCategories,
  listPostsByCategory,
  listPostsByType,
} from "@/modules/posts/queries";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

let day = 0;
async function publish(slug: string, data: { categoryId?: string; postType?: "MEO_VAT" | "GOM_LINK"; productIds?: string[] } = {}) {
  day += 1;
  return db.post.create({
    data: {
      title: slug,
      slug,
      content: "<p>x</p>",
      postType: data.postType ?? "GOM_LINK",
      categoryId: data.categoryId,
      status: "PUBLISHED",
      publishedAt: new Date(Date.UTC(2026, 0, day)),
      postProducts: { create: (data.productIds ?? []).map((productId, sortOrder) => ({ productId, sortOrder })) },
    },
  });
}

describe("ẩn Sản phẩm biến mất khỏi mọi query public (AD-16)", () => {
  it("thẻ Sản phẩm, Link affiliate và ảnh đại diện fallback không còn Sản phẩm ẩn", async () => {
    const category = await db.category.create({ data: { name: "Nhà bếp", slug: "nha-bep" } });
    const hiddenOne = await db.product.create({
      data: { name: "Bị ẩn", affiliateUrl: "https://s.shopee.vn/an", image: "https://cf.shopee.vn/an.jpg" },
    });
    const visible = await db.product.create({
      data: { name: "Đang hiện", affiliateUrl: "https://s.shopee.vn/hien", image: "https://cf.shopee.vn/hien.jpg" },
    });
    await publish("bai-a", { categoryId: category.id, productIds: [hiddenOne.id, visible.id] });
    await publish("bai-b", { categoryId: category.id, productIds: [hiddenOne.id] });

    // Trước khi ẩn: Sản phẩm đầu tiên là ảnh đại diện fallback.
    expect((await getPostBySlug("bai-a"))?.featuredImage).toBe("https://cf.shopee.vn/an.jpg");

    // Ẩn như `setProductHiddenRecord` (action `setProductHidden` test riêng ở modules/products/actions.db.test.ts).
    await db.product.update({ where: { id: hiddenOne.id }, data: { hidden: true } });

    const post = await getPostBySlug("bai-a");
    expect(post?.products).toEqual([
      {
        id: visible.id,
        name: "Đang hiện",
        image: "https://cf.shopee.vn/hien.jpg",
        priceText: null,
        priceUpdatedAt: null,
        affiliateUrl: "https://s.shopee.vn/hien",
      },
    ]);
    expect(post?.featuredImage).toBe("https://cf.shopee.vn/hien.jpg");

    const onlyHidden = await getPostBySlug("bai-b");
    expect(onlyHidden?.products).toEqual([]);
    expect(onlyHidden?.featuredImage).toBeNull();

    const lists = [
      await getLatestPosts(10),
      await getPostsByType("GOM_LINK"),
      await getRelatedPosts("khac", category.id),
      (await listPostsByCategory(category.id, 1)).items,
      (await listPostsByType("GOM_LINK", 1)).items,
    ];
    for (const list of lists) {
      const images = Object.fromEntries(list.map((p) => [p.slug, p.featuredImage]));
      expect(images).toEqual({ "bai-a": "https://cf.shopee.vn/hien.jpg", "bai-b": null });
    }
    expect(JSON.stringify(lists) + JSON.stringify(post)).not.toContain("https://s.shopee.vn/an");
  });

  it("hiện lại thì Sản phẩm quay về đúng thứ tự", async () => {
    const a = await db.product.create({ data: { name: "A", affiliateUrl: "https://shopee.vn/a", hidden: true } });
    const b = await db.product.create({ data: { name: "B", affiliateUrl: "https://shopee.vn/b" } });
    await publish("bai", { productIds: [a.id, b.id] });
    await db.product.update({ where: { id: a.id }, data: { hidden: false } });
    expect((await getPostBySlug("bai"))?.products.map((p) => p.name)).toEqual(["A", "B"]);
  });
});

describe("listNavCategories", () => {
  it("chỉ Danh mục có ≥ 1 Bài web đã xuất bản, theo thứ tự hiển thị", async () => {
    const b = await db.category.create({ data: { name: "B", slug: "b", sortOrder: 1 } });
    const a = await db.category.create({ data: { name: "A", slug: "a", sortOrder: 2 } });
    const draftOnly = await db.category.create({ data: { name: "Nháp", slug: "nhap", sortOrder: 0 } });
    await db.category.create({ data: { name: "Rỗng", slug: "rong", sortOrder: 3 } });
    await publish("p1", { categoryId: a.id });
    await publish("p2", { categoryId: b.id });
    await db.post.create({ data: { title: "n", slug: "n", content: "", postType: "MEO_VAT", categoryId: draftOnly.id } });

    expect(await listNavCategories()).toEqual([
      { name: "B", slug: "b" },
      { name: "A", slug: "a" },
    ]);
    expect((await listCategoriesWithPostCounts()).map((c) => [c.slug, c.posts, c.pages])).toEqual([
      ["nhap", 0, 1],
      ["b", 1, 1],
      ["a", 1, 1],
      ["rong", 0, 1],
    ]);
  });
});

describe("listPostsByCategory / listPostsByType", () => {
  it("phân trang theo PAGE_SIZE, mới nhất trước, chỉ bài đã xuất bản của Danh mục", async () => {
    const c = await db.category.create({ data: { name: "C", slug: "c" } });
    const other = await db.category.create({ data: { name: "D", slug: "d" } });
    for (let i = 0; i < PAGE_SIZE + 2; i++) await publish(`c-${i}`, { categoryId: c.id, postType: "MEO_VAT" });
    await publish("khac", { categoryId: other.id, postType: "MEO_VAT" });
    await db.post.create({ data: { title: "nhap", slug: "nhap", content: "", postType: "MEO_VAT", categoryId: c.id } });

    const p1 = await listPostsByCategory(c.id, 1);
    const p2 = await listPostsByCategory(c.id, 2);
    expect([p1.total, p1.pages, p1.items.length]).toEqual([PAGE_SIZE + 2, 2, PAGE_SIZE]);
    expect(p1.items[0].slug).toBe(`c-${PAGE_SIZE + 1}`);
    expect(p2.items.map((p) => p.slug)).toEqual(["c-1", "c-0"]);
    expect((await listPostsByCategory(c.id, 3)).items).toEqual([]);

    const byType = await listPostsByType("MEO_VAT", 1);
    expect([byType.total, byType.pages]).toEqual([PAGE_SIZE + 3, 2]);
    expect((await listPostsByType("GOM_LINK", 1))).toEqual({ items: [], total: 0, pages: 1 });
  });
});

describe("tag cache của query public (AD-7)", () => {
  it("query trả Sản phẩm gắn `products`, query trả Danh mục gắn `categories`, mọi query gắn `posts`", async () => {
    const c = await db.category.create({ data: { name: "C", slug: "c" } });
    await publish("t", { categoryId: c.id });
    const cases: [string, () => Promise<unknown>, string[]][] = [
      ["getLatestPosts", () => getLatestPosts(1), ["posts", "products"]],
      ["getPostsByType", () => getPostsByType("GOM_LINK"), ["posts", "products"]],
      ["getRelatedPosts", () => getRelatedPosts("x", c.id), ["posts", "products"]],
      ["getPostSlugRedirect", () => getPostSlugRedirect("x"), ["posts"]],
      ["isPublicPostSlug", () => isPublicPostSlug("x"), ["posts"]],
      ["getPostBySlug", () => getPostBySlug("t"), ["posts", "products", "categories"]],
      ["listCategoriesWithPostCounts", () => listCategoriesWithPostCounts(), ["posts", "categories"]],
      ["listNavCategories", () => listNavCategories(), ["posts", "categories"]],
      ["listPostsByCategory", () => listPostsByCategory(c.id, 1), ["posts", "categories", "products"]],
      ["listPostsByType", () => listPostsByType("GOM_LINK", 1), ["posts", "products"]],
    ];
    for (const [name, fn, expected] of cases) {
      expect([name, (await cacheTagsOf(fn)).sort()]).toEqual([name, [...expected].sort()]);
    }
  });
});

describe("getRelatedPosts (UX-DR17)", () => {
  it("tối đa 3 bài cùng Danh mục, mới nhất trước, bỏ chính bài đó và bài khác Danh mục", async () => {
    const c = await db.category.create({ data: { name: "C", slug: "c" } });
    const other = await db.category.create({ data: { name: "D", slug: "d" } });
    for (const slug of ["r1", "r2", "r3", "r4"]) await publish(slug, { categoryId: c.id });
    await publish("khac-danh-muc", { categoryId: other.id });
    await db.post.create({ data: { title: "n", slug: "nhap", content: "", postType: "MEO_VAT", categoryId: c.id } });

    expect((await getRelatedPosts("r4", c.id)).map((p) => p.slug)).toEqual(["r3", "r2", "r1"]);
    expect((await getRelatedPosts("khac-danh-muc", other.id)).map((p) => p.slug)).toEqual([]);
    expect(await getRelatedPosts("r1", null)).toEqual([]);
  });
});

describe("getPostSlugRedirect (AD-20)", () => {
  it("slug cũ trả slug hiện tại của bài đã xuất bản; bài nháp hoặc slug lạ trả null", async () => {
    const p = await publish("moi");
    await db.postSlugRedirect.create({ data: { oldSlug: "cu", postId: p.id } });
    expect(await getPostSlugRedirect("cu")).toBe("moi");
    expect(await getPostSlugRedirect("khong-co")).toBeNull();
    await db.post.update({ where: { id: p.id }, data: { status: "DRAFT" } });
    expect(await getPostSlugRedirect("cu")).toBeNull();
  });
});

describe("isPublicPostSlug", () => {
  it("slug hiện tại hoặc slug cũ của bài đã xuất bản → true; bài về nháp hoặc slug lạ → false", async () => {
    const p = await publish("moi");
    await db.postSlugRedirect.create({ data: { oldSlug: "cu", postId: p.id } });
    expect(await isPublicPostSlug("moi")).toBe(true);
    expect(await isPublicPostSlug("cu")).toBe(true);
    expect(await isPublicPostSlug("khong-co")).toBe(false);
    await db.post.update({ where: { id: p.id }, data: { status: "DRAFT" } });
    expect(await isPublicPostSlug("moi")).toBe(false);
    expect(await isPublicPostSlug("cu")).toBe(false);
  });
});
