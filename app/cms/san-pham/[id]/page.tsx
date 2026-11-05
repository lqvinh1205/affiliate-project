import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductEditScreen } from "@/app/cms/san-pham/_components/product-edit-screen";
import { ProductFormSkeleton } from "@/app/cms/san-pham/_components/product-form-skeleton";

export const metadata: Metadata = { title: "Sửa Sản phẩm" };

export default function EditProductPage({ params }: PageProps<"/cms/san-pham/[id]">) {
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <ProductEditScreen params={params} />
    </Suspense>
  );
}
