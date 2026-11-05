import { describe, expect, it } from "vitest";
import { formatDate } from "@/platform/format";

describe("formatDate", () => {
  it("hiện ngày theo giờ Việt Nam", () => {
    expect(formatDate(new Date("2026-11-04T18:00:00Z"))).toBe("5 tháng 11, 2026");
  });

  it("null trả chuỗi rỗng", () => {
    expect(formatDate(null)).toBe("");
  });
});
