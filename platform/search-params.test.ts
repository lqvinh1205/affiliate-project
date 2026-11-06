import { describe, expect, it } from "vitest";
import { first, pageParam } from "@/platform/search-params";

describe("first", () => {
  it("lấy giá trị đầu; thiếu thì chuỗi rỗng", () => {
    expect(first(["a", "b"])).toBe("a");
    expect(first("x")).toBe("x");
    expect(first(undefined)).toBe("");
  });
});

describe("pageParam", () => {
  it("số nguyên ≥ 1 giữ nguyên; chữ, 0, âm, lẻ, quá lớn, rỗng → trang 1", () => {
    expect(pageParam("3")).toBe(3);
    for (const v of ["abc", "0", "-1", "1.5", "1e400", ""]) expect(pageParam(v)).toBe(1);
  });
});
