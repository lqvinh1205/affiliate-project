import { describe, expect, it } from "vitest";
import {
  approveSuggestionInputSchema,
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
