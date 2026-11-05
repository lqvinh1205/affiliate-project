import { describe, expect, it } from "vitest";
import { imageUrl, optionalText, shopeeAffiliateUrl } from "@/platform/validation/fields";

const SHOPEE_ERROR = "Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)";

describe("shopeeAffiliateUrl", () => {
  it.each(["https://s.shopee.vn/x", "https://shopee.vn/a", "https://shope.ee/x"])("nhận link %s", (url) => {
    expect(shopeeAffiliateUrl.safeParse(url).success).toBe(true);
  });

  it.each(["https://evil.com", "https://shopee.vn.evil.com", "ftp://shopee.vn", "http://shopee.vn/a", "", "shopee.vn"])(
    "từ chối link %s bằng lỗi tiếng Việt",
    (url) => {
      const r = shopeeAffiliateUrl.safeParse(url);
      expect(r.success).toBe(false);
      expect(r.error?.issues[0]?.message).toBe(SHOPEE_ERROR);
    },
  );
});

describe("imageUrl", () => {
  it.each(["https://cf.shopee.vn/a.png", "/anh/a.png"])("nhận ảnh %s", (url) => {
    expect(imageUrl.parse(url)).toBe(url);
  });

  it("chuỗi rỗng thành null", () => {
    expect(imageUrl.parse("  ")).toBeNull();
  });

  it.each(["//evil.com/x.png", "http://cf.shopee.vn/a.png", "https://evil.com/a.png"])(
    "từ chối ảnh %s bằng lỗi tiếng Việt",
    (url) => {
      const r = imageUrl.safeParse(url);
      expect(r.success).toBe(false);
      expect(r.error?.issues[0]?.message).toMatch(/^Ảnh phải là/);
    },
  );
});

describe("optionalText", () => {
  it("cắt khoảng trắng, rỗng thành null", () => {
    expect(optionalText.parse("  a ")).toBe("a");
    expect(optionalText.parse("   ")).toBeNull();
  });
});
