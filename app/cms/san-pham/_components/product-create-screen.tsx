import { connection } from "next/server";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { ProductForm } from "@/modules/products/components/product-form.client";
import { ProductScreenHeader } from "@/app/cms/san-pham/_components/product-screen-header";

export async function ProductCreateScreen() {
  await connection();
  const categories = await listCategoryOptionsForCms();

  return (
    <>
      <ProductScreenHeader title="Tạo Sản phẩm" />
      <ProductForm
        categories={categories}
        priceUpdatedAt={null}
        defaultValues={{
          name: "",
          affiliateUrl: "",
          image: "",
          priceText: "",
          categoryId: "",
          rawText: "",
          rawReviews: "",
          rawImageUrls: "",
        }}
      />
    </>
  );
}
