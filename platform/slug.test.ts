import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RESERVED_ROOT_SLUGS, slugify } from "@/platform/slug";

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

describe("RESERVED_ROOT_SLUGS", () => {
  it("có đủ đường dẫn hệ thống của spine AD-20", () => {
    for (const s of ["cms", "api", "bai-viet", "bio", "tim-kiem", "meo-vat", "gom-link", "trang"]) {
      expect(RESERVED_ROOT_SLUGS).toContain(s);
    }
  });

  it("chứa mọi thư mục tĩnh ở gốc app/(site)", () => {
    const siteDir = fileURLToPath(new URL("../app/(site)", import.meta.url));
    const staticDirs = readdirSync(siteDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !/^[[_(]/.test(d.name))
      .map((d) => d.name);
    expect(staticDirs.length).toBeGreaterThan(0);
    for (const dir of staticDirs) expect(RESERVED_ROOT_SLUGS).toContain(dir);
  });
});
