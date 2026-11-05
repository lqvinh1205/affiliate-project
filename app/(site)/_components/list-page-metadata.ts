import type { Metadata } from "next";

// Metadata trang Danh mục / Loại bài (AD-26): canonical là chính trang đó; meta description = mô tả.
// `noindex`: trang Danh mục chưa có bài (trang mỏng, không có trong điều hướng và sitemap).
export function listPageMetadata({
  title,
  description,
  path,
  page,
  noindex = false,
}: {
  title: string;
  description: string | null;
  path: string;
  page: number;
  noindex?: boolean;
}): Metadata {
  return {
    title: page > 1 ? `${title} – Trang ${page}` : title,
    description: description ?? undefined,
    alternates: { canonical: path },
    ...(noindex && { robots: { index: false } }),
  };
}
