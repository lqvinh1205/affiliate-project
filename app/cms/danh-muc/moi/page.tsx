import type { Metadata } from "next";
import { CategoryCreateScreen } from "@/app/cms/danh-muc/_components/category-create-screen";

export const metadata: Metadata = { title: "Tạo Danh mục" };

export default function NewCategoryPage() {
  return <CategoryCreateScreen />;
}
