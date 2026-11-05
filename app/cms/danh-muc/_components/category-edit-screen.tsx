import { notFound } from "next/navigation";
import { getCategoryForCms } from "@/modules/categories/cms-queries";
import { CategoryForm } from "@/modules/categories/components/category-form.client";
import { CategoryScreenHeader } from "@/app/cms/danh-muc/_components/category-screen-header";

export async function CategoryEditScreen({ params }: Pick<PageProps<"/cms/danh-muc/[id]">, "params">) {
  const { id } = await params;
  const category = await getCategoryForCms(id);
  if (!category) notFound();

  return (
    <>
      <CategoryScreenHeader title="Sửa Danh mục" />
      <CategoryForm
        key={category.id}
        defaultValues={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
        }}
      />
    </>
  );
}
