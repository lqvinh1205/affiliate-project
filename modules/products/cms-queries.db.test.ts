import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { PRODUCT_PICKER_LIMIT } from "@/modules/products/constants";
import { searchProductsForPicker } from "@/modules/products/cms-queries";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

describe("searchProductsForPicker (UX-DR48)", () => {
  it("chỉ Sản phẩm đang hiện, tên chứa từ khoá (không phân biệt hoa thường), mới nhất trước", async () => {
    await db.product.create({ data: { name: "Nồi chiên", affiliateUrl: "https://shopee.vn/1" } });
    await db.product.create({ data: { name: "Nồi cơm ẩn", affiliateUrl: "https://shopee.vn/2", hidden: true } });
    await db.product.create({ data: { name: "Chảo", affiliateUrl: "https://shopee.vn/3" } });
    await db.product.create({ data: { name: "NỒI hấp", affiliateUrl: "https://shopee.vn/4" } });

    expect((await searchProductsForPicker("nồi")).map((p) => p.name)).toEqual(["NỒI hấp", "Nồi chiên"]);
    expect((await searchProductsForPicker("")).map((p) => p.name)).toEqual(["NỒI hấp", "Chảo", "Nồi chiên"]);
    const [first] = await searchProductsForPicker("chảo");
    expect(Object.keys(first).sort()).toEqual(
      ["affiliateUrl", "hidden", "id", "image", "name", "priceText", "priceUpdatedAt"].sort(),
    );
  });

  it(`tối đa ${PRODUCT_PICKER_LIMIT} kết quả`, async () => {
    for (let i = 0; i < PRODUCT_PICKER_LIMIT + 2; i++) {
      await db.product.create({ data: { name: `SP ${i}`, affiliateUrl: `https://shopee.vn/${i}` } });
    }
    expect(await searchProductsForPicker("sp")).toHaveLength(PRODUCT_PICKER_LIMIT);
  });
});
