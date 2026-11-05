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

  // Thư mục route tĩnh ở gốc (bỏ `[động]`, `_riêng`, `(nhóm)`).
  const staticDirs = (dir: string) =>
    readdirSync(fileURLToPath(new URL(dir, import.meta.url)), { withFileTypes: true })
      .filter((d) => d.isDirectory() && !/^[[_(]/.test(d.name))
      .map((d) => d.name);

  it("chứa mọi thư mục tĩnh ở gốc app/(site)", () => {
    const dirs = staticDirs("../app/(site)");
    expect(dirs).toEqual(expect.arrayContaining(["bai-viet", "meo-vat", "gom-link"]));
    for (const dir of dirs) expect(RESERVED_ROOT_SLUGS).toContain(dir);
  });

  it("chứa mọi thư mục tĩnh ở gốc app/ (cms, uploads…)", () => {
    const dirs = staticDirs("../app");
    expect(dirs).toEqual(expect.arrayContaining(["cms", "uploads"]));
    for (const dir of dirs) expect(RESERVED_ROOT_SLUGS).toContain(dir);
  });
});
