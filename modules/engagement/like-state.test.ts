import { describe, expect, it } from "vitest";
import { likeLabel, nextLikeCount } from "@/modules/engagement/like-state";

describe("nextLikeCount", () => {
  it("thả tim +1, bỏ tim −1, không âm", () => {
    expect(nextLikeCount(341, true)).toBe(342);
    expect(nextLikeCount(342, false)).toBe(341);
    expect(nextLikeCount(0, false)).toBe(0);
  });

  it("chưa có số thì vẫn chưa có (hiện —)", () => {
    expect(nextLikeCount(null, true)).toBeNull();
  });
});

describe("likeLabel", () => {
  it("nhãn có số theo vi-VN", () => {
    expect(likeLabel(true, 342)).toBe("Đã thả tim, 342 lượt");
    expect(likeLabel(false, 1234)).toBe("Thả tim bài viết, 1.234 lượt");
  });

  it("chưa có số: chỉ hành động", () => {
    expect(likeLabel(false, null)).toBe("Thả tim bài viết");
  });
});
