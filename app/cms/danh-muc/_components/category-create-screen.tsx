import { CategoryForm } from "@/modules/categories/components/category-form.client";
import { CategoryScreenHeader } from "@/app/cms/danh-muc/_components/category-screen-header";

export function CategoryCreateScreen() {
  return (
    <>
      <CategoryScreenHeader title="Tạo Danh mục" />
      <CategoryForm defaultValues={{ name: "", slug: "", description: "" }} />
    </>
  );
}
