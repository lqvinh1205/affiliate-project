import { describe, expect, it } from "vitest";
import { sanitizePostHtml } from "@/platform/html/sanitize";

describe("sanitizePostHtml", () => {
  it("bỏ thẻ link và ảnh nhưng giữ chữ", () => {
    expect(sanitizePostHtml('<p>a<a href="x">b</a><img src="y"></p>')).toBe("<p>ab</p>");
  });

  it("bỏ link dạng //host và link có rel tuỳ ý", () => {
    expect(sanitizePostHtml('<p><a href="//evil.com" rel="sponsored nofollow">x</a></p>')).toBe("<p>x</p>");
  });

  it("bỏ script, style và thuộc tính sự kiện", () => {
    expect(sanitizePostHtml('<h2 onclick="x()">Tiêu đề</h2><script>alert(1)</script><style>p{}</style>')).toBe(
      "<h2>Tiêu đề</h2>",
    );
  });

  it("giữ các thẻ định dạng bài viết", () => {
    const html = "<h2>A</h2><p><strong>b</strong> <em>c</em></p><ul><li>d</li></ul><blockquote>e</blockquote>";
    expect(sanitizePostHtml(html)).toBe(html);
  });
});
