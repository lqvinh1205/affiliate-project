import Link from "next/link";
import { notFound } from "next/navigation";
import { formatShortDate } from "@/platform/format";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import {
  listContentSetsForProductForCms,
  listPostedPlatformsByProductForCms,
} from "@/modules/content-sets/cms-queries";
import { CONTENT_SET_PRODUCTS_PARAM, PLATFORM_LABEL } from "@/modules/content-sets/constants";
import { POST_STATUS_LABEL } from "@/modules/posts/constants";
import { listPostsUsingProductForCms } from "@/modules/posts/cms-queries";
import { PRODUCT_PICKER_PARAM } from "@/modules/products/constants";
import { getProductForCms } from "@/modules/products/cms-queries";
import { ProductForm } from "@/modules/products/components/product-form.client";
import { ProductStatusBadge } from "@/modules/products/components/product-status-badge";
import { ProductVisibilityButton } from "@/modules/products/components/product-visibility-button.client";
import { ProductResearchSection } from "@/app/cms/san-pham/_components/product-research-section";
import { ProductScreenHeader } from "@/app/cms/san-pham/_components/product-screen-header";

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export async function ProductEditScreen({ params, searchParams }: PageProps<"/cms/san-pham/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [product, categories, posts, contentSets, posted] = await Promise.all([
    getProductForCms(id),
    listCategoryOptionsForCms(),
    listPostsUsingProductForCms(id),
    listContentSetsForProductForCms(id),
    listPostedPlatformsByProductForCms([id]),
  ]);
  if (!product) notFound();
  const platforms = posted.get(id) ?? [];
  const extraIds = first(query[CONTENT_SET_PRODUCTS_PARAM]).split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <ProductScreenHeader
        title="Sửa Sản phẩm"
        badge={<ProductStatusBadge hidden={product.hidden} />}
        actions={<ProductVisibilityButton id={product.id} name={product.name} hidden={product.hidden} />}
      />
      <ProductForm
        key={product.id}
        categories={categories}
        priceUpdatedAt={product.priceUpdatedAt?.toISOString() ?? null}
        defaultValues={{
          id: product.id,
          name: product.name,
          affiliateUrl: product.affiliateUrl,
          image: product.image ?? "",
          priceText: product.priceText ?? "",
          categoryId: product.categoryId ?? "",
          rawText: product.rawText ?? "",
          rawReviews: product.rawReviews ?? "",
          rawImageUrls: product.rawImageUrls.join("\n"),
        }}
      />

      <ProductResearchSection
        product={{ id: product.id, name: product.name, image: product.image }}
        extraIds={extraIds}
        pickerQuery={first(query[PRODUCT_PICKER_PARAM]).trim()}
      />

      <section aria-labelledby="product-usage" className="mt-space-xl space-y-space-sm">
        <h2 id="product-usage" className="text-headline-sm">
          Nơi đang dùng
        </h2>
        {product.hidden && posts.length > 0 && (
          <p className="text-body-sm text-on-surface-variant">
            Sản phẩm đang ẩn: các Bài web dưới đây không còn hiện thẻ và link của nó. Mở từng bài để sửa nội dung nếu cần.
          </p>
        )}
        <p className="text-body-sm">
          {platforms.length > 0
            ? `Đã lên: ${platforms.map((p) => PLATFORM_LABEL[p]).join(" · ")}`
            : "Chưa lên nền tảng nào (chưa có Bài web xuất bản hay bài mạng xã hội đánh dấu đã đăng)."}
        </p>
        {posts.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">Chưa dùng ở Bài web nào.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/cms/bai-viet/${post.id}`}
                  className="flex min-h-touch-target items-center justify-between gap-space-sm px-space-md py-2 hover:bg-surface-container"
                >
                  <span className="min-w-0 truncate font-medium">{post.title}</span>
                  <span className="shrink-0 text-body-sm text-on-surface-variant">
                    Bài web · {POST_STATUS_LABEL[post.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {contentSets.length > 0 && (
          <ul aria-label="Bộ nội dung dùng Sản phẩm này" className="divide-y rounded-xl border">
            {contentSets.map((set) => (
              <li key={set.id}>
                <Link
                  href={`/cms/bo-noi-dung/${set.id}`}
                  className="flex min-h-touch-target items-center justify-between gap-space-sm px-space-md py-2 hover:bg-surface-container"
                >
                  <span className="min-w-0 truncate font-medium">{set.title}</span>
                  <span className="shrink-0 text-body-sm text-on-surface-variant">
                    Bộ nội dung · {formatShortDate(new Date(set.createdAt))}
                    {set.posted.length > 0 && ` · đã đăng ${set.posted.map((p) => PLATFORM_LABEL[p]).join(", ")}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
