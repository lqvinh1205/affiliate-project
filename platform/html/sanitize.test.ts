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

describe("sanitizePostHtml — chỉ định dạng của trình soạn bài (UX-DR50)", () => {
  it("bỏ bảng, ảnh, link khi dán HTML lạ, giữ chữ", () => {
    const pasted =
      '<table><tr><td>ô</td></tr></table><p><a href="https://x.vn">link</a><img src="https://x.vn/a.jpg"></p><script>x()</script>';
    const out = sanitizePostHtml(pasted);
    expect(out).not.toMatch(/<(table|tr|td|a|img|script)\b/);
    expect(out).toContain("ô");
    expect(out).toContain("<p>link</p>");
  });

  it("đổi b/i/h1/h4–h6/div sang thẻ tương đương, bỏ hr, figure", () => {
    expect(sanitizePostHtml("<h1>A</h1><h4>B</h4><p><b>c</b><i>d</i></p><hr><figure>e</figure>")).toBe(
      "<h2>A</h2><h3>B</h3><p><strong>c</strong><em>d</em></p>e",
    );
    expect(sanitizePostHtml("<h5>x</h5><h6>y</h6><div>z</div>")).toBe("<h3>x</h3><h3>y</h3><p>z</p>");
  });
});
