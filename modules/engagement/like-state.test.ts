import { describe, expect, it } from "vitest";
import { likeLabel, nextLikeCount, revertedLikeCount } from "@/modules/engagement/like-state";

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

describe("revertedLikeCount", () => {
  it("về đúng số trước lúc chạm, kể cả khi bỏ tim bị kẹp ở 0", () => {
    // Bỏ tim lúc server đếm 0: optimistic vẫn 0; lỗi → hoàn về 0, không thành 1.
    expect(revertedLikeCount(0, nextLikeCount(0, false))).toBe(0);
    expect(revertedLikeCount(341, 342)).toBe(341);
  });

  it("chạm lúc chưa có số: giữ số server vừa tải về trong lúc chờ", () => {
    expect(revertedLikeCount(null, 4)).toBe(4);
    expect(revertedLikeCount(null, null)).toBeNull();
  });
});
