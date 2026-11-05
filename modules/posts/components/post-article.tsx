import type { PostType } from "@/generated/prisma/enums";
import { formatDate } from "@/platform/format";
import type { Heading } from "@/platform/html/content";
import type { PublicProduct } from "@/modules/products/types";
import { AffiliateDisclosure } from "@/modules/products/components/affiliate-disclosure";
import { ProductCard } from "@/modules/products/components/product-card";
import { PRODUCTS_SECTION_ID } from "@/modules/posts/constants";
import type { PostCardData } from "@/modules/posts/types";
import { ArticleBody } from "@/modules/posts/components/article-body";
import { PostTags } from "@/modules/posts/components/post-tags";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { RelatedPosts } from "@/modules/posts/components/related-posts";
import { TableOfContents } from "@/modules/posts/components/table-of-contents.client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ImageFallback } from "@/components/shared/image-fallback.client";

export type ArticlePost = {
  title: string;
  postType: PostType;
  publishedAt: Date | null;
  readingMinutes: number;
  featuredImage: string | null;
  tags: string[];
  category: { name: string; slug: string } | null;
  // Chỉ Sản phẩm đang hiện, theo thứ tự trong bài.
  products: PublicProduct[];
};

// Thân trang Bài web (UX-DR63, FR-26), dùng chung cho trang public và PreviewSheet trong CMS (AD-11). Không tự tra
// dữ liệu: `html` + `headings` là thân bài đã sanitize và gắn id h2 (AD-22), phút đọc tính trên HTML đó.
// Thứ tự: Breadcrumb → PostTypeBadge + H1 + ngày · phút đọc → AffiliateDisclosure (nếu có Sản phẩm) → ảnh 16:9 →
// TableOfContents → ArticleBody → khối Sản phẩm → PostTags → RelatedPosts. Mobile một cột (TOC thu gọn được ở đầu
// bài); desktop thân 8 cột + cột phải dính (TOC) (UX-DR93).
export function PostArticle({
  post,
  html,
  headings,
  related,
}: {
  post: ArticlePost;
  html: string;
  headings: Heading[];
  related: PostCardData[];
}) {
  const hasProducts = post.products.length > 0;
  return (
    <article className="mx-auto max-w-container-max px-margin py-space-lg lg:px-margin-desktop lg:py-space-xl">
      <div className="lg:grid lg:grid-cols-12 lg:gap-gutter-desktop">
        <div className="min-w-0 space-y-space-lg lg:col-span-8">
          <header className="space-y-space-sm">
            {post.category && <Breadcrumb label={post.category.name} href={`/${post.category.slug}`} />}
            <PostTypeBadge postType={post.postType} />
            <h1 className="text-headline-display-mobile lg:text-headline-display">{post.title}</h1>
            <p className="text-label-sm text-on-surface-variant">
              {post.publishedAt && (
                <>
                  <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
                  <span aria-hidden> · </span>
                </>
              )}
              {post.readingMinutes} phút đọc
            </p>
          </header>

          {/* Nhãn công khai dưới dòng meta, trước ảnh đầu bài; không có Sản phẩm đang hiện thì không render (FR-24). */}
          {hasProducts && <AffiliateDisclosure />}

          {post.featuredImage && (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-container">
              <ImageFallback
                src={post.featuredImage}
                alt={post.title}
                fill
                preload
                sizes="(min-width: 1024px) 740px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="lg:hidden">
            <TableOfContents headings={headings} variant="inline" />
          </div>

          <ArticleBody html={html} />

          {hasProducts && (
            <section id={PRODUCTS_SECTION_ID} aria-labelledby="san-pham-title" className="scroll-mt-20 space-y-space-md">
              <h2 id="san-pham-title" tabIndex={-1} className="text-headline-md outline-none">
                Sản phẩm trong bài
              </h2>
              <ul className="space-y-space-sm">
                {post.products.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <PostTags tags={post.tags} />
        </div>

        {headings.length >= 2 && (
          <div className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24">
              <TableOfContents headings={headings} variant="sticky" />
            </div>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-space-xl border-t pt-space-xl">
          <RelatedPosts posts={related} />
        </div>
      )}
    </article>
  );
}
