import type { Metadata } from "next";
import { SITE_OPEN_GRAPH } from "@/platform/site";

// Metadata trang Danh mục / Loại bài (AD-26): canonical và og:url là chính trang đó; meta description = mô tả,
// trang n > 1 thêm "– Trang n" (bỏ dấu chấm cuối mô tả) để không trùng trang 1.
// `noindex`: trang Danh mục / Loại bài chưa có bài (trang mỏng, không có trong sitemap).
export function listPageMetadata({
  title,
  description,
  path,
  page,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  page: number;
  noindex?: boolean;
}): Metadata {
  const suffix = page > 1 ? ` – Trang ${page}` : "";
  return {
    title: `${title}${suffix}`,
    description: page > 1 ? `${description.replace(/\.$/, "")}${suffix}` : description,
    alternates: { canonical: path },
    openGraph: { ...SITE_OPEN_GRAPH, url: path },
    ...(noindex && { robots: { index: false } }),
  };
}

// Meta description cho Danh mục chưa có mô tả (chỉ dùng cho meta, không hiện trên trang).
export function defaultCategoryDescription(name: string) {
  return `Mẹo vặt và đồ hay chủ đề ${name}: bài hướng dẫn dễ làm, món đồ tiện ích được chọn lọc.`;
}
