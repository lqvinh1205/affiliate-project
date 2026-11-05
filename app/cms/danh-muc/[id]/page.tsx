import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryEditScreen } from "@/app/cms/danh-muc/_components/category-edit-screen";
import { CategoryFormSkeleton } from "@/app/cms/danh-muc/_components/category-form-skeleton";

export const metadata: Metadata = { title: "Sửa Danh mục" };

export default function EditCategoryPage({ params }: PageProps<"/cms/danh-muc/[id]">) {
  return (
    <Suspense fallback={<CategoryFormSkeleton />}>
      <CategoryEditScreen params={params} />
    </Suspense>
  );
}
