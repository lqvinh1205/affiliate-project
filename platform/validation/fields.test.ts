import { describe, expect, it } from "vitest";
import { imageUrl, optionalText, requiredText, shopeeAffiliateUrl, slugField } from "@/platform/validation/fields";

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

describe("requiredText", () => {
  const name = requiredText(5, "Nhập tên");

  it("cắt khoảng trắng và nhận chuỗi trong giới hạn", () => {
    expect(name.parse("  abc ")).toBe("abc");
    expect(name.parse("abcde")).toBe("abcde");
  });

  it("rỗng báo thông báo truyền vào", () => {
    expect(name.safeParse("   ").error?.issues[0]?.message).toBe("Nhập tên");
  });

  it("quá dài báo giới hạn tiếng Việt", () => {
    expect(name.safeParse("abcdef").error?.issues[0]?.message).toBe("Tối đa 5 ký tự");
  });
});

describe("slugField", () => {
  const slug = slugField(10);

  it.each(["do-bep", "a", "top-10", "2026"])("nhận %s", (s) => {
    expect(slug.parse(s)).toBe(s);
  });

  it.each(["Do-bep", "đồ-bếp", "do bep", "-do", "do-", "do--bep", "do_bep"])("từ chối %s bằng lỗi tiếng Việt", (s) => {
    expect(slug.safeParse(s).error?.issues[0]?.message).toMatch(/^Đường dẫn chỉ gồm/);
  });

  it("rỗng và quá dài báo lỗi riêng", () => {
    expect(slug.safeParse("").error?.issues[0]?.message).toBe("Nhập đường dẫn");
    expect(slug.safeParse("a".repeat(11)).error?.issues[0]?.message).toBe("Tối đa 10 ký tự");
  });
});
