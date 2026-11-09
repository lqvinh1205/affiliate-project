import { notFound } from "next/navigation";
import type { Platform } from "@/generated/prisma/enums";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { PRODUCT_PICKER_PARAM } from "@/modules/products/constants";
import { listPickerProductsForCms } from "@/modules/products/cms-queries";
import { getPostForCms } from "@/modules/posts/cms-queries";
import { checkPostSeo, rewritePostDraft } from "@/modules/posts/actions";
import { PostForm } from "@/modules/posts/components/post-form.client";
import { getContentSetForCms } from "@/modules/content-sets/cms-queries";
import { getPostAiStateForCms, getContentSetSuggestionsForCms } from "@/modules/suggestions/cms-queries";
import { SocialFromPostDialog } from "@/modules/suggestions/components/social-from-post-dialog.client";
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
// Bài của Bộ nội dung (AD-19, UX-DR72): link "← Bộ nội dung", khoá Xuất bản khi gợi ý AI còn Đang tạo / Chờ duyệt,
// Cảnh báo rủi ro trong PostEditor — trạng thái lấy từ `suggestions/cms-queries`, truyền qua props (`posts` không
// import `suggestions`). Nút "Tạo bài mạng xã hội" (SocialFromPostDialog, FR-16).
export async function PostEditScreen({ params, searchParams }: PageProps<"/cms/bai-viet/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const productQuery = first(query[PRODUCT_PICKER_PARAM]).trim();
  const [post, categories, ai] = await Promise.all([getPostForCms(id), listCategoryOptionsForCms(), getPostAiStateForCms(id)]);
  if (!post) notFound();
  const setHref = ai.contentSetId ? `/cms/bo-noi-dung/${ai.contentSetId}` : null;
  const existing = ai.contentSetId ? await existingPlatforms(ai.contentSetId) : [];
  const attached = post.postProducts.map((pp) => pp.product);
  const productResults = await listPickerProductsForCms(
    productQuery,
    attached.map((p) => p.id),
  );

  return (
    <>
      <PostScreenHeader
        title="Sửa Bài web"
        contentSetHref={setHref}
        actions={<SocialFromPostDialog postId={post.id} hasProducts={attached.length > 0} existing={existing} />}
      />
      <PostForm
        key={post.id}
        status={post.status}
        publishedAt={post.publishedAt?.toISOString() ?? null}
        categories={categories}
        products={attached.map(toPicker)}
        productResults={productResults.map(toPicker)}
        productQuery={productQuery}
        ai={{ seoCheck: checkPostSeo, rewrite: rewritePostDraft }}
        publishLock={ai.locked && setHref ? { reason: "Cần duyệt bài AI trước khi xuất bản", href: setHref } : null}
        riskWarnings={ai.riskWarnings}
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

// Nền tảng mạng xã hội đã có trong bộ (gợi ý hiện hành hoặc bài đã Duyệt) — SocialFromPostDialog hiện "Đã có".
async function existingPlatforms(contentSetId: string): Promise<Platform[]> {
  const [set, parts] = await Promise.all([getContentSetForCms(contentSetId), getContentSetSuggestionsForCms(contentSetId)]);
  const list: Platform[] = [];
  if (parts.threads || set?.socialPosts.some((s) => s.platform === "THREADS")) list.push("THREADS");
  if (parts.facebook || set?.socialPosts.some((s) => s.platform === "FACEBOOK")) list.push("FACEBOOK");
  return list;
}
