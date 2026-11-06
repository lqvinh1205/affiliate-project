import { describe, expect, it } from "vitest";
import { highlightParts, searchTerms, toSearchText } from "@/platform/search-text";

describe("toSearchText", () => {
  it("bỏ dấu, đ → d, chữ thường, ký tự lạ thành khoảng trắng", () => {
    expect(toSearchText("Nồi chiên  KHÔNG-dầu!")).toBe("noi chien khong dau");
    expect(toSearchText("Đồ ĐẸP đáng mua")).toBe("do dep dang mua");
    expect(toSearchText("Mẹo vặt", null, undefined, "", "#bếp")).toBe("meo vat bep");
  });

  it("chuỗi rỗng / chỉ ký tự lạ → rỗng", () => {
    expect(toSearchText("")).toBe("");
    expect(toSearchText("  …!! ")).toBe("");
  });

  it("chữ tổ hợp (NFD) và dựng sẵn (NFC) gấp như nhau", () => {
    expect(toSearchText("nồi".normalize("NFD"))).toBe(toSearchText("nồi".normalize("NFC")));
  });
});

describe("searchTerms", () => {
  it("tách từ đã gấp, bỏ trùng", () => {
    expect(searchTerms("Nồi chiên nồi")).toEqual(["noi", "chien"]);
    expect(searchTerms("   ")).toEqual([]);
  });
});

describe("highlightParts", () => {
  it("đánh dấu chữ gốc có dấu khớp từ không dấu", () => {
    expect(highlightParts("Tẩy vết ố nồi chiên", ["noi", "chien"])).toEqual([
      { text: "Tẩy vết ố ", match: false },
      { text: "nồi", match: true },
      { text: " ", match: false },
      { text: "chiên", match: true },
    ]);
  });

  it("khớp giữa từ và nhiều lần", () => {
    expect(highlightParts("Đá đá", ["da"])).toEqual([
      { text: "Đá", match: true },
      { text: " ", match: false },
      { text: "đá", match: true },
    ]);
  });

  it("không có từ khớp → một đoạn không đánh dấu", () => {
    expect(highlightParts("Mẹo vặt", ["xyz"])).toEqual([{ text: "Mẹo vặt", match: false }]);
    expect(highlightParts("", ["a"])).toEqual([]);
  });
});
