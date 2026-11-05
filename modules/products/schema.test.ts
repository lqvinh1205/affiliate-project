import { describe, expect, it } from "vitest";
import { productInputSchema } from "@/modules/products/schema";
import { PRODUCT_NAME_MAX, PRODUCT_PRICE_TEXT_MAX, PRODUCT_RAW_IMAGE_URLS_MAX } from "@/modules/products/constants";

const CATEGORY_ID = "7f3c2a8e-1b4d-4c6e-9f0a-2b3c4d5e6f70";
const IMG = "https://down-vn.img.susercontent.com/file/a.jpg";

const valid = {
  name: "Nồi chiên không dầu",
  affiliateUrl: "https://s.shopee.vn/x",
  image: "",
  priceText: "",
  categoryId: "",
  rawText: "",
  rawReviews: "",
  rawImageUrls: "",
};

function errorAt(input: Record<string, unknown>, field: string) {
  const r = productInputSchema.safeParse(input);
  expect(r.success).toBe(false);
  return r.error?.issues.find((i) => i.path[0] === field)?.message;
}

describe("productInputSchema", () => {
  it("tạo hợp lệ: trường tuỳ chọn trống thành null, URL ảnh thô thành mảng rỗng", () => {
    expect(productInputSchema.parse(valid)).toEqual({
      name: "Nồi chiên không dầu",
      affiliateUrl: "https://s.shopee.vn/x",
      image: null,
      priceText: null,
      categoryId: null,
      rawText: null,
      rawReviews: null,
      rawImageUrls: [],
    });
  });

  it("giữ giá, Danh mục, Dữ liệu thô; cắt khoảng trắng", () => {
    const r = productInputSchema.parse({
      ...valid,
      id: "p1",
      name: "  Nồi  ",
      priceText: " ~89.000đ ",
      categoryId: CATEGORY_ID,
      image: IMG,
      rawText: " Mô tả ",
      rawReviews: "Tốt",
      rawImageUrls: `${IMG}\n\n  /uploads/b.png  \n`,
    });
    expect(r).toMatchObject({
      id: "p1",
      name: "Nồi",
      priceText: "~89.000đ",
      categoryId: CATEGORY_ID,
      image: IMG,
      rawText: "Mô tả",
      rawReviews: "Tốt",
      rawImageUrls: [IMG, "/uploads/b.png"],
    });
  });

  it.each(["https://shopee.vn/a", "https://s.shopee.vn/x", "https://shope.ee/abc"])("nhận link Shopee %s", (url) => {
    expect(productInputSchema.safeParse({ ...valid, affiliateUrl: url }).success).toBe(true);
  });

  it.each(["https://shopee.vn.evil.com/a", "ftp://shopee.vn", "http://shopee.vn/a", "shopee.vn/a"])(
    "từ chối link sai domain %s tại trường",
    (url) => {
      expect(errorAt({ ...valid, affiliateUrl: url }, "affiliateUrl")).toBe(
        "Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)",
      );
    },
  );

  // Câu hỏi mở A4: link tìm kiếm Shopee vẫn qua domain check; không thêm quy tắc đường dẫn.
  it("nhận link tìm kiếm Shopee (domain hợp lệ)", () => {
    expect(productInputSchema.safeParse({ ...valid, affiliateUrl: "https://shopee.vn/search?keyword=noi" }).success).toBe(
      true,
    );
  });

  it("Link affiliate trống báo nhập", () => {
    expect(errorAt({ ...valid, affiliateUrl: "  " }, "affiliateUrl")).toBe("Nhập Link affiliate");
  });

  it("ảnh chính host lạ bị từ chối tại trường", () => {
    expect(errorAt({ ...valid, image: "https://evil.com/a.png" }, "image")).toMatch(/^Ảnh phải là link https/);
  });

  it("một dòng ảnh thô host lạ bị từ chối, nêu số dòng", () => {
    expect(errorAt({ ...valid, rawImageUrls: `${IMG}\nhttps://evil.com/a.png` }, "rawImageUrls")).toMatch(
      /^Dòng 2: Ảnh phải là link https/,
    );
  });

  it("quá nhiều ảnh thô bị từ chối", () => {
    const lines = Array.from({ length: PRODUCT_RAW_IMAGE_URLS_MAX + 1 }, () => IMG).join("\n");
    expect(errorAt({ ...valid, rawImageUrls: lines }, "rawImageUrls")).toBe(`Tối đa ${PRODUCT_RAW_IMAGE_URLS_MAX} ảnh`);
  });

  it("tên rỗng hoặc quá dài báo tiếng Việt", () => {
    expect(errorAt({ ...valid, name: " " }, "name")).toBe("Nhập tên Sản phẩm");
    expect(errorAt({ ...valid, name: "a".repeat(PRODUCT_NAME_MAX + 1) }, "name")).toBe(
      `Tối đa ${PRODUCT_NAME_MAX} ký tự`,
    );
  });

  it("giá quá dài báo giới hạn", () => {
    expect(errorAt({ ...valid, priceText: "1".repeat(PRODUCT_PRICE_TEXT_MAX + 1) }, "priceText")).toBe(
      `Tối đa ${PRODUCT_PRICE_TEXT_MAX} ký tự`,
    );
  });

  it("Danh mục không phải id hợp lệ bị từ chối", () => {
    expect(errorAt({ ...valid, categoryId: "abc" }, "categoryId")).toBe("Danh mục không hợp lệ");
  });
});
