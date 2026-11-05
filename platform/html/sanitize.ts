import sanitizeHtml from "sanitize-html";

// Chỉ giữ các thẻ định dạng bài viết; bỏ script, style, event handler, link và ảnh (AD-22).
export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "hr", "strong", "em", "b", "i", "u",
      "ul", "ol", "li", "blockquote", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {},
  });
}
