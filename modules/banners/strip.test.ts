import { describe, expect, it } from "vitest";
import { visibleSlideIndex } from "@/modules/banners/strip";

describe("visibleSlideIndex (UX-DR85)", () => {
  it("lúc mở trang 360px: thẻ sau chỉ ló mép thì chấm vẫn ở thẻ 1", () => {
    expect(visibleSlideIndex([{ index: 0, ratio: 1 }, { index: 1, ratio: 0.14 }])).toBe(0);
  });

  it("nhảy lùi trong một lượt báo: thẻ đang rời khung báo sau vẫn không thắng", () => {
    expect(visibleSlideIndex([{ index: 0, ratio: 0.95 }, { index: 1, ratio: 0.2 }])).toBe(0);
  });

  it("chọn thẻ thấy nhiều nhất khi nhiều thẻ đạt ngưỡng", () => {
    expect(visibleSlideIndex([{ index: 2, ratio: 0.6 }, { index: 3, ratio: 0.9 }])).toBe(3);
  });

  it("không thẻ nào đạt 60% → giữ chấm hiện tại", () => {
    expect(visibleSlideIndex([{ index: 1, ratio: 0.59 }])).toBeNull();
    expect(visibleSlideIndex([])).toBeNull();
  });
});
