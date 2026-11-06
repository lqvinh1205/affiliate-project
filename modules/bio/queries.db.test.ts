import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { cacheTagsOf, resetTestDb } from "@/vitest.db.helpers";
import { BIO_HIGHLIGHTS_LIMIT } from "@/modules/bio/constants";
import { getBioHighlights, getBioPage } from "@/modules/bio/queries";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

const created = (n: number) => new Date(Date.UTC(2026, 10, n));
let seq = 0;
async function product(name: string, day: number, extra: { hidden?: boolean; categoryId?: string } = {}) {
  return db.product.create({
    data: { name, affiliateUrl: `https://shopee.vn/p${++seq}`, createdAt: created(day), ...extra },
  });
}
async function category(name: string, sortOrder: number) {
  return db.category.create({ data: { name, slug: `dm-${++seq}`, sortOrder } });
}

describe("getBioPage (FR-30, AD-7)", () => {
  it("gắn tag bio, products, categories", async () => {
    expect((await cacheTagsOf(() => getBioPage())).sort()).toEqual(["bio", "categories", "products"]);
  });

  it("rỗng: vẫn có giới thiệu và câu công khai, không món, không Danh mục", async () => {
    const page = await getBioPage();
    expect(page.items).toEqual([]);
    expect(page.categories).toEqual([]);
    expect(page.intro.length).toBeGreaterThan(0);
    expect(page.disclosure.length).toBeGreaterThan(0);
  });

  it("chỉ Danh mục có món đang hiện, theo thứ tự hiển thị; chỉ trường public", async () => {
    const bep = await category("Đồ bếp", 2);
    const don = await category("Dọn dẹp", 1);
    const rong = await category("Rỗng", 0);
    const chiAn = await category("Chỉ món ẩn", 3);
    await product("Nồi", 1, { categoryId: bep.id });
    await product("Chổi", 2, { categoryId: don.id });
    await product("Ẩn", 3, { categoryId: chiAn.id, hidden: true });
    await product("Không Danh mục", 4);
    const page = await getBioPage();
    expect(page.categories.map((c) => c.name)).toEqual(["Dọn dẹp", "Đồ bếp"]);
    expect(page.categories.find((c) => c.id === rong.id)).toBeUndefined();
    expect(page.items.map((p) => p.name)).toEqual(["Không Danh mục", "Chổi", "Nồi"]);
    expect(Object.keys(page.items[0]).sort()).toEqual(
      ["affiliateUrl", "categoryId", "id", "image", "name", "pinned", "priceText", "priceUpdatedAt"].sort(),
    );
  });

  it("món tắt trên bio không có, kể cả Danh mục chỉ có món đó", async () => {
    const dm = await category("Đồ bếp", 0);
    const p = await product("Nồi", 1, { categoryId: dm.id });
    await db.bioItem.create({ data: { productId: p.id, visible: false } });
    const page = await getBioPage();
    expect(page.items).toEqual([]);
    expect(page.categories).toEqual([]);
  });
});

describe("getBioHighlights (Story 6.3)", () => {
  it("gắn tag bio, products", async () => {
    expect((await cacheTagsOf(() => getBioHighlights(BIO_HIGHLIGHTS_LIMIT))).sort()).toEqual(["bio", "products"]);
  });

  it(`tối đa ${BIO_HIGHLIGHTS_LIMIT} món theo thứ tự bio (ghim trước), bỏ Sản phẩm ẩn`, async () => {
    for (let i = 1; i <= 10; i++) await product(`SP ${i}`, i);
    const oldest = await product("Ghim", 0);
    await product("Ẩn", 20, { hidden: true });
    await db.bioItem.create({ data: { productId: oldest.id, pinned: true, pinnedAt: new Date() } });
    const list = await getBioHighlights(BIO_HIGHLIGHTS_LIMIT);
    expect(list.map((p) => p.name)).toEqual(["Ghim", "SP 10", "SP 9", "SP 8", "SP 7", "SP 6", "SP 5", "SP 4"]);
    expect(Object.keys(list[0]).sort()).toEqual(["affiliateUrl", "id", "image", "name", "priceText", "priceUpdatedAt"].sort());
  });

  it("không có món → rỗng", async () => {
    await product("Ẩn", 1, { hidden: true });
    expect(await getBioHighlights(BIO_HIGHLIGHTS_LIMIT)).toEqual([]);
  });
});
