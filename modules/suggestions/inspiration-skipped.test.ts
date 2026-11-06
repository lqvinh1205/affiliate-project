import { describe, expect, it } from "vitest";
import { INSPIRATION_VIDEO_SKIPPED, SKIPPED_MESSAGE } from "@/modules/suggestions/constants";
import { inspirationSkippedMessages } from "@/modules/suggestions/inspiration-skipped";

describe("inspirationSkippedMessages (FR-2, UX-DR77)", () => {
  it("không bỏ qua gì → không có câu nào", () => {
    expect(inspirationSkippedMessages([], "image")).toEqual([]);
  });

  it("chỉ có link video → gợi ý tải ảnh chụp màn hình", () => {
    expect(inspirationSkippedMessages(["video"], null)).toEqual([INSPIRATION_VIDEO_SKIPPED.link]);
  });

  it("link + ảnh chụp màn hình đã đọc → nói hồ sơ dựa trên ảnh, không gợi ý tải ảnh lại", () => {
    const [msg] = inspirationSkippedMessages(["video"], "image");
    expect(msg).toBe(INSPIRATION_VIDEO_SKIPPED.imageRead);
    expect(msg).not.toMatch(/tải|Tạo lại/);
  });

  it("link + ảnh nhưng AI không đọc được ảnh → không nói dựa trên ảnh, không gợi ý tải ảnh", () => {
    expect(inspirationSkippedMessages(["video", "images"], "image")).toEqual([
      INSPIRATION_VIDEO_SKIPPED.imageNotRead,
      SKIPPED_MESSAGE.images,
    ]);
  });

  it("file video → gợi ý đổi sang ảnh, không gợi ý tải file video", () => {
    const [msg] = inspirationSkippedMessages(["video"], "video");
    expect(msg).toBe(INSPIRATION_VIDEO_SKIPPED.file);
    expect(Object.values(INSPIRATION_VIDEO_SKIPPED).join(" ")).not.toMatch(/Tải file video/);
  });
});
