import sanitizeHtml from "sanitize-html";

// Allowlist = đúng các định dạng của trình soạn bài (UX-DR50) và prompt AI: H2, H3, đoạn, danh sách, trích dẫn
// (Callout), đậm, nghiêng. Bỏ script, style, event handler, link, ảnh, bảng (AD-22). `b`/`i`/`h1`/`h4`–`h6`/`div` đổi sang thẻ
// tương đương để HTML dán từ nơi khác giữ được định dạng. Hàm thuần: chạy cả ở server (khi ghi, khi render) và
// client (bản xem trước, lọc khi dán).
export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "p", "br", "strong", "em", "ul", "ol", "li", "blockquote"],
    allowedAttributes: {},
    transformTags: { b: "strong", i: "em", h1: "h2", h4: "h3", h5: "h3", h6: "h3", div: "p" },
  });
}
