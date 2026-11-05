import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublicCategory } from "@/modules/categories/queries";
import { listCategoriesWithPostCounts, listPostsByCategory } from "@/modules/posts/queries";
import { loadCategory } from "@/app/(site)/[danh-muc]/_components/load-category";
import { listPageMetadata } from "@/app/(site)/_components/list-page-metadata";
import { PostListScreen } from "@/app/(site)/_components/post-list-screen";
import { PostListSkeleton } from "@/app/(site)/_components/post-list-skeleton";

// Không có Danh mục nào: tham số giữ chỗ là đường dẫn hệ thống, không bao giờ là Danh mục → prerender 404.
const NO_CATEGORY = "trang";

export async function generateStaticParams() {
  const categories = await listCategoriesWithPostCounts();
  return categories.length > 0 ? categories.map((c) => ({ "danh-muc": c.slug })) : [{ "danh-muc": NO_CATEGORY }];
}

export async function generateMetadata({ params }: PageProps<"/[danh-muc]">): Promise<Metadata> {
  const category = await getPublicCategory((await params)["danh-muc"]);
  if (!category) return {};
  const { total } = await listPostsByCategory(category.id, 1);
  return listPageMetadata({
    title: category.name,
    description: category.description,
    path: `/${category.slug}`,
    page: 1,
    noindex: total === 0,
  });
}

export default async function CategoryPage({ params }: PageProps<"/[danh-muc]">) {
  const category = await loadCategory((await params)["danh-muc"]);
  const data = await listPostsByCategory(category.id, 1);
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostListScreen
        title={category.name}
        description={category.description}
        base={`/${category.slug}`}
        page={1}
        data={data}
        emptyTitle="Danh mục này chưa có bài nào"
      />
    </Suspense>
  );
}
