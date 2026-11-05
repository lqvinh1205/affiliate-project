import Image from "next/image";
import Link from "next/link";
import { withHeadingIds } from "@/platform/html/content";
import { formatDate } from "@/platform/format";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import { SITE_NAME, SITE_URL } from "@/platform/site";
import { POST_TYPES } from "@/modules/posts/constants";
import { getRelatedPosts } from "@/modules/posts/queries";
import type { PublicPost } from "@/modules/posts/types";
import { PostCard } from "@/modules/posts/components/post-card";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { AffiliateDisclosure } from "@/modules/products/components/affiliate-disclosure";
import { ProductCard } from "@/modules/products/components/product-card";
import { JsonLd } from "@/app/(site)/_components/json-ld";
import { SectionHeading } from "@/app/(site)/_components/section-heading";

// Màn Bài web: nhận bài đã tra ở `page.tsx` (tra + `notFound()` trước `<Suspense>` — AD-12).
export async function PostScreen({ post }: { post: PublicPost }) {
  const { html, headings } = withHeadingIds(sanitizePostHtml(post.content));
  const related = await getRelatedPosts(post.slug, post.postType);
  const postType = POST_TYPES[post.postType];
  const url = `${SITE_URL}/bai-viet/${post.slug}`;
  // Breadcrumb theo Danh mục (AD-26); bài chưa có Danh mục chỉ có Trang chủ.
  const breadcrumb = [
    { name: "Trang chủ", item: SITE_URL },
    ...(post.category ? [{ name: post.category.name, item: `${SITE_URL}/${post.category.slug}` }] : []),
    { name: post.title, item: url },
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: post.title,
              description: post.seoDescription ?? post.excerpt,
              image: post.featuredImage ? [post.featuredImage] : undefined,
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

      <header className="mx-auto max-w-5xl space-y-4">
        <nav aria-label="Vị trí trang" className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Trang chủ</Link>
          {post.category && (
            <>
              <span className="mx-2" aria-hidden>›</span>
              <Link href={`/${post.category.slug}`} className="hover:text-primary">{post.category.name}</Link>
            </>
          )}
        </nav>
        <PostTypeBadge postType={post.postType} />
        <h1 className="max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="max-w-2xl text-lg text-muted-foreground">{post.excerpt}</p>}
        <p className="text-sm text-muted-foreground">
          {formatDate(post.publishedAt)} · {post.readingMinutes} phút đọc
        </p>
        {/* Nhãn công khai ngay dưới dòng meta, trước ảnh đầu bài; bài không có Sản phẩm đang hiện thì không render (FR-24). */}
        {post.products.length > 0 && <AffiliateDisclosure />}
      </header>

      <div className="relative mx-auto mt-8 aspect-video max-w-5xl overflow-hidden rounded-sm bg-muted">
        <Image
          src={post.featuredImage || "/placeholder.svg"}
          alt={post.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[1fr_14rem]">
        <div className="min-w-0 space-y-8">
          <div
            className="prose max-w-none sm:prose-lg text-foreground prose-headings:font-heading prose-headings:text-foreground prose-h2:scroll-mt-24 prose-a:text-primary prose-strong:text-foreground prose-li:marker:text-primary"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {post.products.length > 0 && (
            <section id="san-pham" aria-labelledby="san-pham-title" className="scroll-mt-24">
              <h2 id="san-pham-title" className="mb-space-md text-2xl">
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

          {post.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <li key={t} className="rounded-sm bg-muted px-2.5 py-1 text-sm text-muted-foreground">
                  #{t}
                </li>
              ))}
            </ul>
          )}
        </div>

        {headings.length > 1 && (
          <aside className="hidden lg:block">
            <nav aria-label="Mục lục" className="sticky top-24 border-l pl-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Mục lục
              </p>
              <ul className="space-y-2 text-sm">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="text-muted-foreground hover:text-primary">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl">
          <SectionHeading title="Bài liên quan" href={`/${postType.slug}`} />
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
