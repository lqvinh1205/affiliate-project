import { connection } from "next/server";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { getInspirationForCms } from "@/modules/inspirations/cms-queries";
import { INSPIRATION_PARAM } from "@/modules/inspirations/constants";
import { InspirationStrip } from "@/modules/inspirations/components/inspiration-strip";
import { ProductForm } from "@/modules/products/components/product-form.client";
import { ProductScreenHeader } from "@/app/cms/san-pham/_components/product-screen-header";

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

// Mở từ Cảm hứng ("Gắn sản phẩm" → "Tạo Sản phẩm mới", UX-DR61): dải "Từ Cảm hứng" đầu màn; tạo xong chuyển sang Chi
// tiết Sản phẩm vẫn kèm `?cam-hung=` để Bộ nội dung tạo ra ghi liên kết (FR-2).
export async function ProductCreateScreen({ searchParams }: Pick<PageProps<"/cms/san-pham/moi">, "searchParams">) {
  await connection();
  const inspirationId = first((await searchParams)[INSPIRATION_PARAM]).trim();
  const [categories, inspiration] = await Promise.all([
    listCategoryOptionsForCms(),
    inspirationId ? getInspirationForCms(inspirationId) : null,
  ]);

  return (
    <>
      <ProductScreenHeader title="Tạo Sản phẩm" />
      {inspiration && (
        <div className="mb-space-md">
          <InspirationStrip id={inspiration.id} label={inspiration.label} />
        </div>
      )}
      <ProductForm
        categories={categories}
        priceUpdatedAt={null}
        createdQuery={inspiration ? `${INSPIRATION_PARAM}=${encodeURIComponent(inspiration.id)}` : null}
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
