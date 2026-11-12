import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import type { PostType } from "@/generated/prisma/enums";
import { POST_TYPES } from "@/modules/posts/constants";
import { listPostsByType } from "@/modules/posts/queries";
import { listPageMetadata } from "@/app/(site)/_components/list-page-metadata";
import { pageHref, parsePageParam, staticPageParams } from "@/app/(site)/_components/pagination-items";

// Phần dùng chung của hai thư mục Loại bài `/meo-vat`, `/gom-link` (+ `/trang/[n]`), lọc theo `PostType`
// (spine AD-7: thư mục riêng, không đi qua `[danh-muc]`). Màn ở `post-type-screen.tsx`.

export async function postTypeStaticParams(postType: PostType) {
  const { pages } = await listPostsByType(postType, 1);
  return staticPageParams(pages);
}

// Loại bài chưa có bài xuất bản là trang mỏng như Danh mục rỗng: `noindex`, không vào sitemap (AD-26).
export async function postTypeMetadata(postType: PostType, page: number): Promise<Metadata> {
  const { label, slug, description } = POST_TYPES[postType];
  const { total } = await listPostsByType(postType, 1);
  return listPageMetadata({ title: label, description, path: pageHref(`/${slug}`, page), page, noindex: total === 0 });
}

// Đoạn `[n]` → số trang; `n = 1` → 308 về trang gốc; không hợp lệ hoặc vượt trang cuối → 404.
// Gọi ở `page.tsx` trước `<Suspense>` (AD-12).
export async function loadPostTypePage(postType: PostType, n: string) {
  const page = parsePageParam(n);
  if (page === 1) permanentRedirect(`/${POST_TYPES[postType].slug}`);
  if (!page) notFound();
  const data = await listPostsByType(postType, page);
  if (page > data.pages) notFound();
  return { page, data };
}
