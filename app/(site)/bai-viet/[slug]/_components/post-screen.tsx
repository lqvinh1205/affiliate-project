import { withHeadingIds } from "@/platform/html/content";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import { SITE_NAME, SITE_URL } from "@/platform/site";
import { getRelatedPosts } from "@/modules/posts/queries";
import type { PublicPost } from "@/modules/posts/types";
import { PostArticle } from "@/modules/posts/components/post-article";
import { JsonLd } from "@/app/(site)/_components/json-ld";
import { ArticleActionBar } from "@/app/(site)/bai-viet/[slug]/_components/article-action-bar.client";

// Màn Bài web: nhận bài đã tra ở `page.tsx` (tra + `notFound()`/`permanentRedirect()` trước `<Suspense>` — AD-12).
// Thân bài sanitize cả khi render (AD-22); mục lục, phút đọc tính trên HTML đã sanitize. JSON-LD `Article` +
// `BreadcrumbList` theo Danh mục (AD-26). Mobile: ArticleActionBar thay BottomTabBar (UX-DR27).
export async function PostScreen({ post }: { post: PublicPost }) {
  const { html, headings } = withHeadingIds(sanitizePostHtml(post.content));
  const related = await getRelatedPosts(post.slug, post.categoryId);
  const url = `${SITE_URL}/bai-viet/${post.slug}`;
  // Breadcrumb theo Danh mục (AD-26); bài chưa có Danh mục chỉ có Trang chủ.
  const breadcrumb = [
    { name: "Trang chủ", item: SITE_URL },
    ...(post.category ? [{ name: post.category.name, item: `${SITE_URL}/${post.category.slug}` }] : []),
    { name: post.title, item: url },
  ];
  const image = post.featuredImage ? new URL(post.featuredImage, SITE_URL).toString() : undefined;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: post.title,
              description: post.seoDescription ?? post.excerpt ?? undefined,
              image: image ? [image] : undefined,
              datePublished: post.publishedAt?.toISOString(),
              dateModified: post.updatedAt.toISOString(),
              mainEntityOfPage: url,
              author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
              publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: breadcrumb.map((b, i) => ({ "@type": "ListItem", position: i + 1, ...b })),
            },
          ],
        }}
      />
      <PostArticle post={post} html={html} headings={headings} related={related} />
      <ArticleActionBar hasProducts={post.products.length > 0} />
    </>
  );
}
