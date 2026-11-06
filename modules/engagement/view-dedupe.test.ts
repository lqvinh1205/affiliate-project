import { describe, expect, it } from "vitest";
import { shouldMarkViewed, shouldSendView } from "@/modules/engagement/view-dedupe";

describe("shouldSendView", () => {
  it("gửi khi chưa xem và không phải trình duyệt của Vinh", () => {
    expect(shouldSendView(null, null)).toBe(true);
  });

  it("không gửi khi đã xem, khi là trình duyệt CMS, hoặc khi localStorage bị chặn", () => {
    expect(shouldSendView(null, "1")).toBe(false);
    expect(shouldSendView("1", null)).toBe(false);
    expect(shouldSendView(undefined, undefined)).toBe(false);
    expect(shouldSendView(null, undefined)).toBe(false);
  });
});

describe("shouldMarkViewed", () => {
  it("đánh dấu khi server nhận, kể cả không đếm (bot / bài không có)", () => {
    expect(shouldMarkViewed({ ok: true })).toBe(true);
  });

  it("không đánh dấu khi bị giới hạn tần suất hay lỗi, để lần sau gửi lại", () => {
    expect(shouldMarkViewed({ ok: false })).toBe(false);
  });
});
