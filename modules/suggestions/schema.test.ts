import { describe, expect, it } from "vitest";
import {
  approveSuggestionInputSchema,
  createContentSetInputSchema,
  createSocialFromPostInputSchema,
  researchProductInputSchema,
  suggestionSkippedSchema,
} from "@/modules/suggestions/schema";

describe("researchProductInputSchema", () => {
  it("chỉ dẫn trống hoặc không gửi thành null", () => {
    expect(researchProductInputSchema.parse({ productId: "p" })).toEqual({ productId: "p", instruction: null });
    expect(researchProductInputSchema.parse({ productId: "p", instruction: "  " }).instruction).toBeNull();
    expect(researchProductInputSchema.parse({ productId: "p", instruction: " ngắn hơn " }).instruction).toBe("ngắn hơn");
  });

  it("chỉ dẫn quá 200 ký tự báo lỗi tiếng Việt", () => {
    const r = researchProductInputSchema.safeParse({ productId: "p", instruction: "a".repeat(201) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("Chỉ dẫn tối đa 200 ký tự");
  });
});

describe("approveSuggestionInputSchema", () => {
  it("thiếu id báo lỗi; payload tuỳ chọn", () => {
    expect(approveSuggestionInputSchema.safeParse({ id: "" }).success).toBe(false);
    expect(approveSuggestionInputSchema.parse({ id: "s" })).toEqual({ id: "s" });
  });
});

describe("suggestionSkippedSchema", () => {
  it("chỉ nhận images, webSearch, video", () => {
    expect(suggestionSkippedSchema.safeParse(["images", "webSearch", "video"]).success).toBe(true);
    expect(suggestionSkippedSchema.safeParse(["audio"]).success).toBe(false);
  });
});

describe("createContentSetInputSchema (FR-12)", () => {
  const valid = {
    productIds: ["p1", "p2"],
    angle: { productId: "p1", id: "goc-viet-1" },
    angleEdit: " ",
    audience: { productId: "p1", id: "doc-gia-1" },
    platforms: ["WEBSITE", "THREADS"],
  };

  it("hợp lệ: bản sửa trống thành null", () => {
    expect(createContentSetInputSchema.parse(valid)).toMatchObject({ angleEdit: null, audienceEdit: null });
  });

  it("thiếu Góc viết / Người đọc / nền tảng báo lỗi tiếng Việt", () => {
    const msg = (patch: object) => {
      const r = createContentSetInputSchema.safeParse({ ...valid, ...patch });
      return r.success ? null : r.error.issues[0].message;
    };
    expect(msg({ angle: null })).toBe("Chọn một Góc viết");
    expect(msg({ audience: null })).toBe("Chọn một Người đọc");
    expect(msg({ platforms: [] })).toBe("Chọn ít nhất một nền tảng");
    expect(msg({ productIds: ["a", "b", "c", "d"] })).toBe("Tối đa 3 Sản phẩm mỗi bộ");
    expect(msg({ productIds: ["a", "a"] })).toBe("Sản phẩm bị thêm trùng");
  });
});

describe("createSocialFromPostInputSchema (FR-16)", () => {
  it("chỉ Threads / Facebook", () => {
    expect(createSocialFromPostInputSchema.safeParse({ postId: "p", platforms: ["WEBSITE"] }).success).toBe(false);
    expect(createSocialFromPostInputSchema.safeParse({ postId: "p", platforms: ["THREADS"] }).success).toBe(true);
  });
});
