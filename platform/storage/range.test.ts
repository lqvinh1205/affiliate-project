import { describe, expect, it } from "vitest";
import { parseByteRange } from "@/platform/storage/range";

describe("parseByteRange", () => {
  it("khoảng đủ hai đầu, mở cuối, hậu tố; đầu cuối vượt file thì kẹp lại", () => {
    expect(parseByteRange("bytes=0-1", 10)).toEqual({ start: 0, end: 1 });
    expect(parseByteRange("bytes=4-", 10)).toEqual({ start: 4, end: 9 });
    expect(parseByteRange("bytes=-3", 10)).toEqual({ start: 7, end: 9 });
    expect(parseByteRange("bytes=-30", 10)).toEqual({ start: 0, end: 9 });
    expect(parseByteRange("bytes=5-99", 10)).toEqual({ start: 5, end: 9 });
  });

  it("không có, sai cú pháp, nhiều khoảng, đầu > cuối → null (trả cả file)", () => {
    for (const h of [null, "", "bytes=-", "items=0-1", "bytes=0-1,4-5", "bytes=5-2", "bytes=a-b"]) {
      expect(parseByteRange(h, 10)).toBeNull();
    }
  });

  it("bắt đầu ngoài file hoặc hậu tố 0 → unsatisfiable", () => {
    expect(parseByteRange("bytes=10-", 10)).toBe("unsatisfiable");
    expect(parseByteRange("bytes=-0", 10)).toBe("unsatisfiable");
  });
});
