import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductListScreen } from "@/app/cms/san-pham/_components/product-list-screen";
import { ProductListSkeleton } from "@/app/cms/san-pham/_components/product-list-skeleton";

export const metadata: Metadata = { title: "Sản phẩm" };

export default function ProductsPage({ searchParams }: PageProps<"/cms/san-pham">) {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductListScreen searchParams={searchParams} />
    </Suspense>
  );
}
