import { describe, expect, it } from "vitest";
import { formatCount, formatDate, formatShortDate, vietnamDay } from "@/platform/format";

describe("formatDate", () => {
  it("hiện ngày theo giờ Việt Nam", () => {
    expect(formatDate(new Date("2026-11-04T18:00:00Z"))).toBe("5 tháng 11, 2026");
  });

  it("null trả chuỗi rỗng", () => {
    expect(formatDate(null)).toBe("");
  });
});

describe("formatShortDate", () => {
  it("hiện dd/mm/yyyy theo giờ Việt Nam", () => {
    expect(formatShortDate(new Date("2026-11-04T18:00:00Z"))).toBe("05/11/2026");
    expect(formatShortDate(new Date("2026-01-31T16:59:00Z"))).toBe("31/01/2026");
  });

  it("null trả chuỗi rỗng", () => {
    expect(formatShortDate(null)).toBe("");
  });
});

describe("formatCount", () => {
  it("phân cách hàng nghìn bằng dấu chấm (vi-VN)", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1234)).toBe("1.234");
    expect(formatCount(1234567)).toBe("1.234.567");
  });
});

describe("vietnamDay", () => {
  it("lấy ngày theo giờ Việt Nam, trả 00:00 UTC của ngày đó", () => {
    // 17:30 UTC ngày 5 = 00:30 ngày 6 ở Việt Nam.
    expect(vietnamDay(new Date("2026-11-05T17:30:00Z")).toISOString()).toBe("2026-11-06T00:00:00.000Z");
    expect(vietnamDay(new Date("2026-11-05T16:59:59Z")).toISOString()).toBe("2026-11-05T00:00:00.000Z");
  });
});
