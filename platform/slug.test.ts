import { describe, expect, it } from "vitest";
import { slugify } from "@/platform/slug";

describe("slugify", () => {
  it("bỏ dấu tiếng Việt và đổi đ thành d", () => {
    expect(slugify("Mẹo vặt Đẹp đơn giản")).toBe("meo-vat-dep-don-gian");
  });

  it("gộp ký tự lạ thành một gạch và bỏ gạch hai đầu", () => {
    expect(slugify("  --Gom link!! 2026?? ")).toBe("gom-link-2026");
  });

  it("chuỗi không có chữ trả rỗng", () => {
    expect(slugify("!!!")).toBe("");
  });
});
