import Link from "next/link";
import { notFound } from "next/navigation";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { listPostsUsingProductForCms } from "@/modules/posts/cms-queries";
import { getProductForCms } from "@/modules/products/cms-queries";
import { ProductForm } from "@/modules/products/components/product-form.client";
import { ProductStatusBadge } from "@/modules/products/components/product-status-badge";
import { ProductScreenHeader } from "@/app/cms/san-pham/_components/product-screen-header";

const POST_STATUS_LABEL = { DRAFT: "Nháp", PUBLISHED: "Đã xuất bản" } as const;

export async function ProductEditScreen({ params }: Pick<PageProps<"/cms/san-pham/[id]">, "params">) {
  const { id } = await params;
  const [product, categories, posts] = await Promise.all([
    getProductForCms(id),
    listCategoryOptionsForCms(),
    listPostsUsingProductForCms(id),
  ]);
  if (!product) notFound();

  return (
    <>
      <ProductScreenHeader title="Sửa Sản phẩm" badge={<ProductStatusBadge />} />
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

      <section aria-labelledby="product-usage" className="mt-space-xl space-y-space-sm">
        <h2 id="product-usage" className="text-headline-sm">
          Nơi đang dùng
        </h2>
        {posts.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">Chưa dùng ở Bài web nào.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/cms/posts/${post.id}`}
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
      </section>
    </>
  );
}
