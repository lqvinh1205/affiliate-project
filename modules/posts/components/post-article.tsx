import type { ReactNode } from "react";
import { formatDate } from "@/platform/format";
import type { Heading } from "@/platform/html/content";
import { AffiliateDisclosure } from "@/modules/products/components/affiliate-disclosure";
import { ProductCard } from "@/modules/products/components/product-card";
import { ARTICLE_ACTIONS_TITLE_ID, PRODUCTS_SECTION_ID, PRODUCTS_TITLE_ID } from "@/modules/posts/constants";
import type { ArticlePost, PostCardData } from "@/modules/posts/types";
import { ArticleBody } from "@/modules/posts/components/article-body";
import { PostTags } from "@/modules/posts/components/post-tags";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { RelatedPosts } from "@/modules/posts/components/related-posts";
import { TableOfContents } from "@/modules/posts/components/table-of-contents.client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ImageFallback } from "@/components/shared/image-fallback.client";

// Thân trang Bài web (UX-DR63, FR-26), dùng chung cho trang public và PreviewSheet trong CMS (AD-11). Không tự tra
// dữ liệu: `html` + `headings` là thân bài đã sanitize và gắn id h2 (AD-22), phút đọc tính trên HTML đó.
// Thứ tự: Breadcrumb → PostTypeBadge + H1 + ngày · phút đọc → AffiliateDisclosure (nếu có Sản phẩm) → ảnh 16:9 →
// TableOfContents → ArticleBody → khối Sản phẩm → PostTags → thả tim + chia sẻ → RelatedPosts. Mobile một cột (TOC
// thu gọn được ở đầu bài); desktop thân 8 cột + cột phải dính (TOC, tim, chia sẻ) (UX-DR63, UX-DR93).
// `actions`: LikeButton + ShareButtons do trang public truyền vào (`posts` không import `engagement` — AD-2); bản xem
// trước không có.
export function PostArticle({
  post,
  html,
  headings,
  related,
  actions,
}: {
  post: ArticlePost;
  html: string;
  headings: Heading[];
  related: PostCardData[];
  actions?: ReactNode;
}) {
  const hasProducts = post.products.length > 0;
  const hasToc = headings.length >= 2;
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
            <section id={PRODUCTS_SECTION_ID} aria-labelledby={PRODUCTS_TITLE_ID} className="scroll-mt-20 space-y-space-md">
              <h2 id={PRODUCTS_TITLE_ID} tabIndex={-1} className="text-headline-md outline-none">
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

          {actions && (
            <section
              aria-labelledby={ARTICLE_ACTIONS_TITLE_ID}
              className="flex flex-col items-center gap-space-sm rounded-xl bg-surface-container p-space-md text-center"
            >
              <h2 id={ARTICLE_ACTIONS_TITLE_ID} className="text-headline-sm">
                Bạn thấy bài viết này hữu ích?
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Một lượt thả tim hoặc chia sẻ là động lực để mình gom thêm nhiều mẹo hay!
              </p>
              {actions}
            </section>
          )}
        </div>

        {(hasToc || actions) && (
          <div className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24 space-y-space-lg">
              {hasToc && <TableOfContents headings={headings} variant="sticky" />}
              {actions}
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
