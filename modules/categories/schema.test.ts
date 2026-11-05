import { describe, expect, it } from "vitest";
import { categoryInputSchema, moveCategoryInputSchema } from "@/modules/categories/schema";
import { CATEGORY_DESCRIPTION_MAX, CATEGORY_NAME_MAX } from "@/modules/categories/constants";

const valid = { name: "Đồ bếp", slug: "", description: "" };

function errorAt(input: Record<string, unknown>, field: string) {
  const r = categoryInputSchema.safeParse(input);
  expect(r.success).toBe(false);
  return r.error?.issues.find((i) => i.path[0] === field)?.message;
}

describe("categoryInputSchema", () => {
  it("đường dẫn trống thì tạo từ tên, mô tả trống thành null", () => {
    expect(categoryInputSchema.parse(valid)).toEqual({ name: "Đồ bếp", slug: "do-bep", description: null });
  });

  it("giữ đường dẫn và mô tả người nhập, cắt khoảng trắng", () => {
    const r = categoryInputSchema.parse({ id: "abc", name: " Nhà bếp ", slug: " nha-bep-xinh ", description: " Mô tả " });
    expect(r).toEqual({ id: "abc", name: "Nhà bếp", slug: "nha-bep-xinh", description: "Mô tả" });
  });

  it.each(["cms", "bai-viet", "meo-vat", "gom-link", "trang", "api", "bio", "tim-kiem"])(
    "từ chối đường dẫn hệ thống %s tại trường slug",
    (slug) => {
      expect(errorAt({ ...valid, slug }, "slug")).toBe("Đường dẫn này đã dành cho hệ thống");
    },
  );

  it("tên tạo ra đường dẫn hệ thống cũng bị từ chối tại trường slug", () => {
    expect(errorAt({ ...valid, name: "Trang" }, "slug")).toBe("Đường dẫn này đã dành cho hệ thống");
  });

  it.each(["Đồ-bếp", "do bep", "Do-Bep", "do_bep"])("từ chối đường dẫn sai dạng %s", (slug) => {
    expect(errorAt({ ...valid, slug }, "slug")).toMatch(/^Đường dẫn chỉ gồm/);
  });

  it("tên không có chữ cái nào và đường dẫn trống thì báo nhập đường dẫn", () => {
    expect(errorAt({ ...valid, name: "!!!" }, "slug")).toBe("Nhập đường dẫn");
  });

  it("tên rỗng báo tiếng Việt", () => {
    expect(errorAt({ ...valid, name: "   " }, "name")).toBe("Nhập tên Danh mục");
  });

  it("tên quá dài báo giới hạn", () => {
    expect(errorAt({ ...valid, name: "a".repeat(CATEGORY_NAME_MAX + 1) }, "name")).toBe(
      `Tối đa ${CATEGORY_NAME_MAX} ký tự`,
    );
  });

  it("mô tả quá dài báo giới hạn", () => {
    expect(errorAt({ ...valid, description: "a".repeat(CATEGORY_DESCRIPTION_MAX + 1) }, "description")).toBe(
      `Tối đa ${CATEGORY_DESCRIPTION_MAX} ký tự`,
    );
  });
});

describe("moveCategoryInputSchema", () => {
  it("chỉ nhận hướng lên hoặc xuống", () => {
    expect(moveCategoryInputSchema.safeParse({ id: "a", direction: "up" }).success).toBe(true);
    expect(moveCategoryInputSchema.safeParse({ id: "a", direction: "left" }).success).toBe(false);
  });
});
