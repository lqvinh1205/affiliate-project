import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryListScreen } from "@/app/cms/danh-muc/_components/category-list-screen";
import { CategoryListSkeleton } from "@/app/cms/danh-muc/_components/category-list-skeleton";

export const metadata: Metadata = { title: "Danh mục" };

export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoryListSkeleton />}>
      <CategoryListScreen />
    </Suspense>
  );
}
