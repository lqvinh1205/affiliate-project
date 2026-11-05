import { describe, expect, it } from "vitest";
import { formatDate, formatShortDate } from "@/platform/format";

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
