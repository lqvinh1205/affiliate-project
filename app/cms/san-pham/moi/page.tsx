import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCreateScreen } from "@/app/cms/san-pham/_components/product-create-screen";
import { ProductFormSkeleton } from "@/app/cms/san-pham/_components/product-form-skeleton";

export const metadata: Metadata = { title: "Tạo Sản phẩm" };

export default function NewProductPage({ searchParams }: PageProps<"/cms/san-pham/moi">) {
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <ProductCreateScreen searchParams={searchParams} />
    </Suspense>
  );
}
