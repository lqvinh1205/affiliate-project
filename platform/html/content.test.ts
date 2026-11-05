import { describe, expect, it } from "vitest";
import { readingMinutes, withHeadingIds } from "@/platform/html/content";

describe("readingMinutes", () => {
  it("tối thiểu 1 phút", () => {
    expect(readingMinutes("<p>vài chữ</p>")).toBe(1);
  });

  it("tính 200 từ một phút", () => {
    expect(readingMinutes(`<p>${"chữ ".repeat(600)}</p>`)).toBe(3);
  });
});

describe("withHeadingIds", () => {
  it("gắn id tiếng Việt không dấu cho h2 và trả mục lục", () => {
    const { html, headings } = withHeadingIds("<h2>Mẹo vặt Đẹp</h2><p>x</p><h2>Mẹo vặt Đẹp</h2>");
    expect(headings.map((h) => h.id)).toEqual(["meo-vat-dep", "meo-vat-dep-2"]);
    expect(html).toBe('<h2 id="meo-vat-dep">Mẹo vặt Đẹp</h2><p>x</p><h2 id="meo-vat-dep-2">Mẹo vặt Đẹp</h2>');
  });

  it("h2 không có chữ dùng id muc-n", () => {
    expect(withHeadingIds("<h2>!!!</h2>").headings[0].id).toBe("muc-1");
  });
});
