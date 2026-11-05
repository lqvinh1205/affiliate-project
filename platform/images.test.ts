import { describe, expect, it } from "vitest";
import { IMAGE_HOSTS, isAllowedImageUrl } from "@/platform/images";

describe("isAllowedImageUrl", () => {
  it.each(["https://cf.shopee.vn/a.png", "https://down-vn.img.susercontent.com/file/a", "/anh/a.png"])(
    "nhận ảnh hợp lệ %s",
    (url) => {
      expect(isAllowedImageUrl(url)).toBe(true);
    },
  );

  it.each([
    "//evil.com/x.png",
    "/\\evil.com/x.png",
    "/\t/evil.com/x.png",
    "/\n/evil.com/x.png",
    "http://cf.shopee.vn/a.png",
    "https://evil.com/a.png",
    "https://abc.supabase.co/a.png",
    "javascript:alert(1)",
    "khong-phai-url",
    "/uploads/a.jpg?v=1",
    "/uploads/a.jpg#x",
  ])("từ chối ảnh %s", (url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });

  it("không còn host Supabase", () => {
    expect(IMAGE_HOSTS.some((h) => h.includes("supabase"))).toBe(false);
  });
});
