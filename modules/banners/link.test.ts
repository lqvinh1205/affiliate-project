import { describe, expect, it } from "vitest";
import { bannerLinkKind, bannerPostSlug } from "@/modules/banners/link";

describe("bannerLinkKind (FR-32, FR-25)", () => {
  it("link Shopee chính chủ (https)", () => {
    for (const url of ["https://shopee.vn/x", "https://s.shopee.vn/abc", "https://shope.ee/abc"]) {
      expect(bannerLinkKind(url)).toBe("shopee");
    }
  });

  it("đường dẫn trong site", () => {
    for (const url of ["/", "/bio", "/bai-viet/meo-hay?x=1#muc"]) {
      expect(bannerLinkKind(url)).toBe("internal");
    }
  });

  it("từ chối link ngoài, Shopee giả, http, đường dẫn trỏ host khác", () => {
    for (const url of [
      "https://lazada.vn/x",
      "https://shopee.vn.evil.com/x",
      "http://shopee.vn/x",
      "//evil.com/x",
      "/\\evil.com",
      "javascript:alert(1)",
      "bio",
    ]) {
      expect(bannerLinkKind(url)).toBeNull();
    }
  });
});

describe("bannerPostSlug", () => {
  it("lấy slug từ đường dẫn trang bài, bỏ query/hash", () => {
    expect(bannerPostSlug("/bai-viet/meo-hay")).toBe("meo-hay");
    expect(bannerPostSlug("/bai-viet/meo-hay/?x=1#muc")).toBe("meo-hay");
    expect(bannerPostSlug("/bai-viet/m%E1%BA%B9o")).toBe("mẹo");
  });

  it("không phải trang bài → null", () => {
    for (const url of ["/", "/bio", "/bai-viet", "/bai-viet/", "/bai-viet/a/b", "/nha-bep", "https://s.shopee.vn/bai-viet/x", "//evil.com/bai-viet/x", "/bai-viet/%E0%A4%A"]) {
      expect(bannerPostSlug(url)).toBeNull();
    }
  });
});
