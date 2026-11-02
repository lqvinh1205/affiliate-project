import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { AffiliateDisclosure } from "@/components/site/affiliate-disclosure";
import { CategoryBadge } from "@/components/site/category-badge";
import { PostCard } from "@/components/site/post-card";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { CATEGORIES } from "@/lib/categories";
import { withHeadingIds } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { getPostBySlug, getPublishedSlugs, getRelatedPosts } from "@/lib/posts";
import { sanitizePostHtml } from "@/lib/sanitize";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateStaticParams() {
  const posts = await getPublishedSlugs();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/bai-viet/[slug]">): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug);
  if (!post) return {};
  const description = post.seoDescription ?? post.excerpt ?? undefined;
  return {
    title: post.seoTitle ?? post.title,
    description,
    keywords: post.seoKeywords,
    alternates: { canonical: `/bai-viet/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/bai-viet/[slug]">) {
  const post = await getPostBySlug((await params).slug);
  if (!post) notFound();

  const { html, headings } = withHeadingIds(sanitizePostHtml(post.content));
  const related = await getRelatedPosts(post.slug, post.category);
  const category = CATEGORIES[post.category];
  const url = `${SITE_URL}/bai-viet/${post.slug}`;

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
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: category.label, item: `${SITE_URL}/${category.slug}` },
                { "@type": "ListItem", position: 3, name: post.title, item: url },
              ],
            },
          ],
        }}
      />

      <header className="mx-auto max-w-5xl space-y-4">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Trang chủ</Link>
          <span className="mx-2" aria-hidden>/</span>
          <Link href={`/${category.slug}`} className="hover:text-primary">{category.label}</Link>
        </nav>
        <CategoryBadge category={post.category} />
        <h1 className="max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="max-w-2xl text-lg text-muted-foreground">{post.excerpt}</p>}
        <p className="text-sm text-muted-foreground">
          {formatDate(post.publishedAt)} · {post.readingMinutes} phút đọc
        </p>
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
          {post.products.length > 0 && <AffiliateDisclosure />}
          <div
            className="prose max-w-none sm:prose-lg text-foreground prose-headings:font-heading prose-headings:text-foreground prose-h2:scroll-mt-24 prose-a:text-primary prose-strong:text-foreground prose-li:marker:text-primary"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {post.products.length > 0 && (
            <section>
              <h2 className="mb-2 text-2xl">Sản phẩm trong bài</h2>
              <div className="-space-y-px">
                {post.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
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
          <SectionHeading title="Bài liên quan" href={`/${category.slug}`} />
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
