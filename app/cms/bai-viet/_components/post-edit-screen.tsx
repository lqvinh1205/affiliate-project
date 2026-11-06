import { notFound } from "next/navigation";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { PRODUCT_PICKER_PARAM } from "@/modules/products/constants";
import { listPickerProductsForCms } from "@/modules/products/cms-queries";
import { getPostForCms } from "@/modules/posts/cms-queries";
import { checkPostSeo } from "@/modules/posts/actions";
import { PostForm } from "@/modules/posts/components/post-form.client";
import { runThreads } from "@/modules/content-sets/actions";
import { PostScreenHeader } from "@/app/cms/bai-viet/_components/post-screen-header";

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

// Ngày → chuỗi ISO trước khi truyền xuống client component (AD-8).
function toPicker<T extends { priceUpdatedAt: Date | null }>(p: T) {
  return { ...p, priceUpdatedAt: p.priceUpdatedAt?.toISOString() ?? null };
}

// Màn sửa Bài web. Ô tìm của ProductPicker đưa từ khoá lên `?sp=`; Screen đọc lại và tìm qua `cms-queries`
// (AD-12, không có action đọc). Form chỉ đọc `defaultValues` lúc mount nên đổi `?sp=` không mất nội dung đang sửa.
export async function PostEditScreen({ params, searchParams }: PageProps<"/cms/bai-viet/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const productQuery = first(query[PRODUCT_PICKER_PARAM]).trim();
  const [post, categories] = await Promise.all([getPostForCms(id), listCategoryOptionsForCms()]);
  if (!post) notFound();
  const attached = post.postProducts.map((pp) => pp.product);
  const productResults = await listPickerProductsForCms(
    productQuery,
    attached.map((p) => p.id),
  );

  return (
    <>
      <PostScreenHeader title="Sửa Bài web" />
      <PostForm
        key={post.id}
        status={post.status}
        publishedAt={post.publishedAt?.toISOString() ?? null}
        categories={categories}
        products={attached.map(toPicker)}
        productResults={productResults.map(toPicker)}
        productQuery={productQuery}
        ai={{ seoCheck: checkPostSeo, threads: runThreads }}
        defaultValues={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          featuredImage: post.featuredImage ?? "",
          postType: post.postType,
          categoryId: post.categoryId ?? "",
          content: post.content,
          tags: post.tags.join(", "),
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          seoKeywords: post.seoKeywords.join(", "),
          productIds: attached.map((p) => p.id),
        }}
      />
    </>
  );
}
