// Phân trang tĩnh của trang Danh mục / Loại bài (spine AD-7, EXPERIENCE.md › Pagination).

// Trang 1 là trang gốc; trang n là `…/trang/n` của chính trang đó.
export function pageHref(base: string, page: number) {
  return page === 1 ? base : `${base}/trang/${page}`;
}

// Đoạn `[n]` của `/…/trang/[n]`: số nguyên dương viết chuẩn ("01", "1.0", "-1" không nhận) → số, còn lại null.
export function parsePageParam(n: string): number | null {
  return /^[1-9][0-9]{0,5}$/.test(n) ? Number(n) : null;
}

// Ô hiện: trang đầu, cuối, trang hiện tại ±1; chỗ bị bỏ là "gap". Chỉ một trang thì không có ô nào.
export function paginationItems(page: number, pages: number): (number | "gap")[] {
  if (pages <= 1) return [];
  const shown = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  for (const [i, n] of shown.entries()) {
    if (i > 0 && n - shown[i - 1] > 1) items.push("gap");
    items.push(n);
  }
  return items;
}

// `generateStaticParams` của `…/trang/[n]`: các trang thật từ 2; không có thì một tham số giữ chỗ "2"
// để prerender `notFound()` (không bao giờ trả mảng rỗng — AD-7).
export function staticPageParams(pages: number): { n: string }[] {
  const params = Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ n: String(i + 2) }));
  return params.length > 0 ? params : [{ n: "2" }];
}
