import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublicCategory } from "@/modules/categories/queries";
import { listCategoriesWithPostCounts, listPostsByCategory } from "@/modules/posts/queries";
import { loadCategory } from "@/app/(site)/[danh-muc]/_components/load-category";
import { defaultCategoryDescription, listPageMetadata } from "@/app/(site)/_components/list-page-metadata";
import { pageHref, parsePageParam, staticPageParams } from "@/app/(site)/_components/pagination-items";
import { PostListScreen } from "@/app/(site)/_components/post-list-screen";
import { PostListSkeleton } from "@/app/(site)/_components/post-list-skeleton";

// Các trang thật từ 2 của mọi Danh mục; không có thì giữ chỗ `n = "2"` của Danh mục đầu tiên (AD-7).
export async function generateStaticParams() {
  const categories = await listCategoriesWithPostCounts();
  const params = categories.flatMap((c) =>
    c.pages > 1 ? staticPageParams(c.pages).map((p) => ({ "danh-muc": c.slug, ...p })) : [],
  );
  if (params.length > 0) return params;
  return [{ "danh-muc": categories[0]?.slug ?? "trang", n: "2" }];
}

export async function generateMetadata({ params }: PageProps<"/[danh-muc]/trang/[n]">): Promise<Metadata> {
  const { "danh-muc": slug, n } = await params;
  const [category, page] = [await getPublicCategory(slug), parsePageParam(n)];
  if (!category || !page) return {};
  const path = pageHref(`/${category.slug}`, page);
  const description = category.description ?? defaultCategoryDescription(category.name);
  return listPageMetadata({ title: category.name, description, path, page });
}

export default async function CategoryPagedPage({ params }: PageProps<"/[danh-muc]/trang/[n]">) {
  const { "danh-muc": slug, n } = await params;
  // Kiểm `[n]` trước khi tra Danh mục: `/cu/trang/abc` là 404, không 308 sang đường dẫn mới.
  const page = parsePageParam(n);
  if (!page) notFound();
  const category = await loadCategory(slug, page > 1 ? `/trang/${page}` : "");
  if (page === 1) permanentRedirect(`/${category.slug}`);
  const data = await listPostsByCategory(category.id, page);
  if (page > data.pages) notFound();
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostListScreen
        title={category.name}
        description={category.description}
        base={`/${category.slug}`}
        page={page}
        data={data}
        emptyTitle="Danh mục này chưa có bài nào"
      />
    </Suspense>
  );
}
