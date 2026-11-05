import { describe, expect, it } from "vitest";
import { pageHref, paginationItems, parsePageParam, staticPageParams } from "@/app/(site)/_components/pagination-items";

describe("paginationItems", () => {
  it("một trang thì ẩn", () => {
    expect(paginationItems(1, 1)).toEqual([]);
  });

  it("hiện trang đầu, cuối và ±1 quanh trang hiện tại", () => {
    expect(paginationItems(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(paginationItems(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(paginationItems(10, 10)).toEqual([1, "gap", 9, 10]);
    expect(paginationItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("pageHref", () => {
  it("trang 1 là trang gốc, trang n là /trang/n", () => {
    expect(pageHref("/nha-bep", 1)).toBe("/nha-bep");
    expect(pageHref("/meo-vat", 3)).toBe("/meo-vat/trang/3");
  });
});

describe("parsePageParam", () => {
  it.each([
    ["1", 1],
    ["2", 2],
    ["99", 99],
  ])("nhận %s", (n, expected) => {
    expect(parsePageParam(n)).toBe(expected);
  });

  it.each(["0", "01", "-1", "1.5", "abc", "", "9999999"])("từ chối %s", (n) => {
    expect(parsePageParam(n)).toBeNull();
  });
});

describe("staticPageParams", () => {
  it("trả các trang từ 2; không có trang 2 thì giữ chỗ n=2", () => {
    expect(staticPageParams(3)).toEqual([{ n: "2" }, { n: "3" }]);
    expect(staticPageParams(1)).toEqual([{ n: "2" }]);
  });
});
