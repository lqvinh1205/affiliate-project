import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { saveProduct, setProductHidden } from "@/modules/products/actions";
import type { ProductFormValues } from "@/modules/products/schema";

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

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

describe("saveProduct", () => {
  it("lưu hợp lệ thì trả id và làm mới tag products", async () => {
    const res = await saveProduct(base);
    expect(res.ok).toBe(true);
    expect(await db.product.count()).toBe(1);
    expect(actionTest.updatedTags).toEqual(["products"]);
  });

  it("Link affiliate sai domain trả ok:false, không lưu, không làm mới cache", async () => {
    expect(await saveProduct({ ...base, affiliateUrl: "https://shopee.vn.evil.com/a" })).toEqual({
      ok: false,
      error: "Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)",
    });
    expect(await db.product.count()).toBe(0);
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("chưa đăng nhập thì từ chối", async () => {
    actionTest.authorization = null;
    expect(await saveProduct(base)).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
    expect(await db.product.count()).toBe(0);
  });
});

describe("setProductHidden", () => {
  it("ẩn Sản phẩm và làm mới tag products; hoàn tác hiện lại", async () => {
    const p = await db.product.create({ data: { name: "p", affiliateUrl: "https://shopee.vn/p" } });
    expect(await setProductHidden({ id: p.id, hidden: true })).toEqual({ ok: true, id: p.id, hidden: true });
    expect(actionTest.updatedTags).toEqual(["products"]);
    expect(await setProductHidden({ id: p.id, hidden: false })).toEqual({ ok: true, id: p.id, hidden: false });
    expect(await db.product.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({ hidden: false });
  });

  it("Sản phẩm không tồn tại trả lỗi tiếng Việt, không làm mới cache", async () => {
    expect(await setProductHidden({ id: "khong-co", hidden: true })).toEqual({
      ok: false,
      error: "Không tìm thấy Sản phẩm. Có thể đã bị xoá.",
    });
    expect(actionTest.updatedTags).toEqual([]);
  });
});
