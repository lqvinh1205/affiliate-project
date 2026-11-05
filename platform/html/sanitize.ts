import sanitizeHtml from "sanitize-html";

// Allowlist = đúng các định dạng của trình soạn bài (UX-DR50) và prompt AI: H2, H3, đoạn, danh sách, trích dẫn
// (Callout), đậm, nghiêng. Bỏ script, style, event handler, link, ảnh, bảng (AD-22). `b`/`i`/`h4` đổi sang thẻ
// tương đương để HTML dán từ nơi khác giữ được định dạng. Hàm thuần: chạy cả ở server (khi ghi, khi render) và
// client (bản xem trước, lọc khi dán).
export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "p", "br", "strong", "em", "ul", "ol", "li", "blockquote"],
    allowedAttributes: {},
    transformTags: { b: "strong", i: "em", h4: "h3" },
  });
}
