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
    expect(bioSettingsInputSchema.parse({ intro: " Xin chào ", disclosure: " Mình nhận hoa hồng. " })).toEqual({
      intro: "Xin chào",
      disclosure: "Mình nhận hoa hồng.",
    });
  });

  it("câu công khai không tắt được: rỗng báo lỗi tại trường", () => {
    expect(errorAt({ intro: "Xin chào", disclosure: "   " }, "disclosure")).toBe("Nhập câu công khai");
    expect(errorAt({ intro: "", disclosure: "Có" }, "intro")).toBe("Nhập phần giới thiệu");
  });

  it("vượt giới hạn cứng báo số ký tự", () => {
    expect(errorAt({ intro: "a".repeat(BIO_INTRO_MAX + 1), disclosure: "Có" }, "intro")).toBe(`Tối đa ${BIO_INTRO_MAX} ký tự`);
    expect(errorAt({ intro: "Có", disclosure: "a".repeat(BIO_DISCLOSURE_MAX + 1) }, "disclosure")).toBe(
      `Tối đa ${BIO_DISCLOSURE_MAX} ký tự`,
    );
  });

  it("hướng di chuyển chỉ lên/xuống", () => {
    expect(moveBioItemInputSchema.safeParse({ productId: "x", direction: "left" }).success).toBe(false);
    expect(moveBioItemInputSchema.safeParse({ productId: "", direction: "up" }).success).toBe(false);
  });
});
