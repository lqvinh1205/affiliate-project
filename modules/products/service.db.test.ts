import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { UserError } from "@/platform/errors";
import { PRODUCT_PAGE_SIZE } from "@/modules/products/constants";
import { listProductsForCms } from "@/modules/products/cms-queries";
import { productInputSchema, type ProductFormValues } from "@/modules/products/schema";
import { saveProductRecord } from "@/modules/products/service";

const base: ProductFormValues = {
  name: "Nồi chiên",
  affiliateUrl: "https://s.shopee.vn/x",
  image: "",
  priceText: "",
  categoryId: "",
  rawText: "",
  rawReviews: "",
  rawImageUrls: "",
};

function save(values: Partial<ProductFormValues>) {
  return saveProductRecord(productInputSchema.parse({ ...base, ...values }));
}

const row = (id: string) => db.product.findUniqueOrThrow({ where: { id } });

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

describe("saveProductRecord", () => {
  it("tạo hợp lệ: lưu giá, Danh mục, Dữ liệu thô; priceUpdatedAt = lúc lưu", async () => {
    const category = await db.category.create({ data: { name: "Nhà bếp", slug: "nha-bep" } });
    const before = Date.now();
    const { id } = await save({
      priceText: "~89.000đ",
      categoryId: category.id,
      rawText: "Mô tả",
      rawImageUrls: "https://down-vn.img.susercontent.com/a.jpg",
    });
    const p = await row(id);
    expect(p).toMatchObject({
      name: "Nồi chiên",
      affiliateUrl: "https://s.shopee.vn/x",
      priceText: "~89.000đ",
      categoryId: category.id,
      rawText: "Mô tả",
      rawReviews: null,
      rawImageUrls: ["https://down-vn.img.susercontent.com/a.jpg"],
    });
    expect(p.priceUpdatedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });

  it("tạo không có giá thì priceUpdatedAt null", async () => {
    const { id } = await save({});
    expect(await row(id)).toMatchObject({ priceText: null, priceUpdatedAt: null, categoryId: null });
  });

  it("đổi giá thì cập nhật priceUpdatedAt", async () => {
    const { id } = await save({ priceText: "~89.000đ" });
    const old = new Date("2026-01-01T00:00:00Z");
    await db.product.update({ where: { id }, data: { priceUpdatedAt: old } });
    await save({ id, priceText: "~79.000đ" });
    const p = await row(id);
    expect(p.priceText).toBe("~79.000đ");
    expect(p.priceUpdatedAt!.getTime()).toBeGreaterThan(old.getTime());
  });

  it("sửa tên, giữ giá thì priceUpdatedAt giữ nguyên", async () => {
    const { id } = await save({ priceText: "~89.000đ" });
    const old = new Date("2026-01-01T00:00:00Z");
    await db.product.update({ where: { id }, data: { priceUpdatedAt: old } });
    await save({ id, name: "Nồi chiên 5L", priceText: " ~89.000đ " });
    expect(await row(id)).toMatchObject({ name: "Nồi chiên 5L", priceText: "~89.000đ", priceUpdatedAt: old });
  });

  it("xoá giá thì priceText và priceUpdatedAt về null", async () => {
    const { id } = await save({ priceText: "~89.000đ" });
    await save({ id, priceText: "" });
    expect(await row(id)).toMatchObject({ priceText: null, priceUpdatedAt: null });
  });

  it("Danh mục không tồn tại báo UserError, không lưu", async () => {
    await expect(save({ categoryId: "7f3c2a8e-1b4d-4c6e-9f0a-2b3c4d5e6f70" })).rejects.toBeInstanceOf(UserError);
    expect(await db.product.count()).toBe(0);
  });

  it("sửa Sản phẩm không tồn tại báo UserError", async () => {
    await expect(save({ id: "khong-co" })).rejects.toBeInstanceOf(UserError);
  });
});

describe("listProductsForCms", () => {
  async function seed(names: string[]) {
    // createdAt tăng dần theo thứ tự mảng → phần tử cuối là mới nhất.
    for (const [i, name] of names.entries()) {
      await db.product.create({
        data: { name, affiliateUrl: "https://shopee.vn/x", createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)) },
      });
    }
  }

  it("tìm theo tên không phân biệt hoa thường, mới nhất trước", async () => {
    await seed(["Nồi chiên", "Chảo", "NỒI cơm điện", "Bát"]);
    const { items, total } = await listProductsForCms({ q: "nồi", page: 1 });
    expect(total).toBe(2);
    expect(items.map((p) => p.name)).toEqual(["NỒI cơm điện", "Nồi chiên"]);
  });

  it("phân trang theo PRODUCT_PAGE_SIZE", async () => {
    await seed(Array.from({ length: PRODUCT_PAGE_SIZE + 3 }, (_, i) => `SP ${String(i).padStart(2, "0")}`));
    const p1 = await listProductsForCms({ q: "", page: 1 });
    const p2 = await listProductsForCms({ q: "", page: 2 });
    expect(p1.total).toBe(PRODUCT_PAGE_SIZE + 3);
    expect(p1.items).toHaveLength(PRODUCT_PAGE_SIZE);
    expect(p1.items[0].name).toBe(`SP ${PRODUCT_PAGE_SIZE + 2}`);
    expect(p2.items.map((p) => p.name)).toEqual(["SP 02", "SP 01", "SP 00"]);
  });

  it("lọc không ra thì trả rỗng", async () => {
    await seed(["Chảo"]);
    expect(await listProductsForCms({ q: "nồi", page: 1 })).toEqual({ items: [], total: 0 });
  });
});
