import { describe, expect, it } from "vitest";
import { bioSettingsInputSchema, moveBioItemInputSchema } from "@/modules/bio/schema";
import { BIO_DISCLOSURE_MAX, BIO_INTRO_MAX } from "@/modules/bio/constants";

function errorAt(input: Record<string, unknown>, field: string) {
  const r = bioSettingsInputSchema.safeParse(input);
  expect(r.success).toBe(false);
  return r.error?.issues.find((i) => i.path[0] === field)?.message;
}

describe("bioSettingsInputSchema (FR-31)", () => {
  it("cắt khoảng trắng", () => {
    expect(bioSettingsInputSchema.parse({ intro: " Xin chào ", disclosure: " Mình nhận hoa hồng. ", avatar: " " })).toEqual({
      intro: "Xin chào",
      disclosure: "Mình nhận hoa hồng.",
      avatar: null,
    });
  });

  it("ảnh đại diện tuỳ chọn, cùng luật ảnh Sản phẩm (upload hoặc host cho phép)", () => {
    expect(bioSettingsInputSchema.parse({ intro: "a", disclosure: "b", avatar: "/uploads/x.webp" }).avatar).toBe(
      "/uploads/x.webp",
    );
    expect(errorAt({ intro: "a", disclosure: "b", avatar: "http://example.com/x.jpg" }, "avatar")).toBe(
      "Ảnh phải là link https từ Shopee hoặc đường dẫn trong site",
    );
  });

  it("câu công khai không tắt được: rỗng báo lỗi tại trường", () => {
    expect(errorAt({ intro: "Xin chào", disclosure: "   ", avatar: "" }, "disclosure")).toBe("Nhập câu công khai");
    expect(errorAt({ intro: "", disclosure: "Có", avatar: "" }, "intro")).toBe("Nhập phần giới thiệu");
  });

  it("vượt giới hạn cứng báo số ký tự", () => {
    expect(errorAt({ intro: "a".repeat(BIO_INTRO_MAX + 1), disclosure: "Có", avatar: "" }, "intro")).toBe(`Tối đa ${BIO_INTRO_MAX} ký tự`);
    expect(errorAt({ intro: "Có", disclosure: "a".repeat(BIO_DISCLOSURE_MAX + 1), avatar: "" }, "disclosure")).toBe(
      `Tối đa ${BIO_DISCLOSURE_MAX} ký tự`,
    );
  });

  it("hướng di chuyển chỉ lên/xuống", () => {
    expect(moveBioItemInputSchema.safeParse({ productId: "x", direction: "left" }).success).toBe(false);
    expect(moveBioItemInputSchema.safeParse({ productId: "", direction: "up" }).success).toBe(false);
  });
});
