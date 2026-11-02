import sanitizeHtml from "sanitize-html";

// Chỉ giữ các thẻ định dạng bài viết; bỏ script, style, event handler...
export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "hr", "strong", "em", "b", "i", "u",
      "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener" }),
    },
  });
}
