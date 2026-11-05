// ArticleBody (UX-DR24): `html` là thân bài **đã** qua `sanitizePostHtml` và `withHeadingIds` (AD-22) — nơi gọi
// (trang bài, bản xem trước) lo hai bước đó; component chỉ hiển thị. Kiểu chữ ở utility `article-body` (globals.css).
export function ArticleBody({ html }: { html: string }) {
  return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
