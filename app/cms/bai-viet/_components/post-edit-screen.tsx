import { notFound } from "next/navigation";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { PRODUCT_PICKER_PARAM } from "@/modules/products/constants";
import { searchProductsForPicker } from "@/modules/products/cms-queries";
import { getPostForCms } from "@/modules/posts/cms-queries";
import { PostForm } from "@/modules/posts/components/post-form.client";
import { runSeoCheck, runThreads } from "@/app/cms/actions";
import { PostScreenHeader } from "@/app/cms/bai-viet/_components/post-screen-header";

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

// Màn sửa Bài web. Ô tìm của ProductPicker đưa từ khoá lên `?sp=`; Screen đọc lại và tìm qua `cms-queries`
// (AD-12, không có action đọc). Form chỉ đọc `defaultValues` lúc mount nên đổi `?sp=` không mất nội dung đang sửa.
export async function PostEditScreen({ params, searchParams }: PageProps<"/cms/bai-viet/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const productQuery = first(query[PRODUCT_PICKER_PARAM]).trim();
  const [post, categories, productResults] = await Promise.all([
    getPostForCms(id),
    listCategoryOptionsForCms(),
    searchProductsForPicker(productQuery),
  ]);
  if (!post) notFound();

  return (
    <>
      <PostScreenHeader title="Sửa Bài web" />
      <PostForm
        key={post.id}
        status={post.status}
        publishedAt={post.publishedAt?.toISOString() ?? null}
        categories={categories}
        products={post.postProducts.map((pp) => pp.product)}
        productResults={productResults}
        productQuery={productQuery}
        ai={{ seoCheck: runSeoCheck, threads: runThreads }}
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
          productIds: post.postProducts.map((pp) => pp.product.id),
        }}
      />
    </>
  );
}
