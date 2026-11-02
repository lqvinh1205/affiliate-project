import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "@/components/site/category-badge";
import { PostCard, PostListItem } from "@/components/site/post-card";
import { SectionHeading } from "@/components/site/section-heading";
import { CATEGORIES } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { getLatestPosts, getPostsByCategory } from "@/lib/posts";

export default async function HomePage() {
  const [latest, meoVat, gomLink] = await Promise.all([
    getLatestPosts(7),
    getPostsByCategory("MEO_VAT", 4),
    getPostsByCategory("GOM_LINK", 8),
  ]);
  const [hero, ...rest] = latest;

  if (!hero) {
    return <p className="px-4 py-24 text-center text-muted-foreground">Chưa có bài viết nào.</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-8 sm:py-12">
      {/* Bài nổi bật */}
      <Link href={`/bai-viet/${hero.slug}`} className="group grid items-center gap-6 md:grid-cols-[1.4fr_1fr] md:gap-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
          <Image
            src={hero.featuredImage || "/placeholder.svg"}
            alt={hero.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover transition duration-700 group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        </div>
        <div className="space-y-4">
          <CategoryBadge category={hero.category} />
          <h1 className="text-3xl leading-tight decoration-primary/40 decoration-2 underline-offset-[6px] group-hover:underline sm:text-4xl lg:text-[2.75rem]">
            {hero.title}
          </h1>
          {hero.excerpt && <p className="text-lg text-muted-foreground">{hero.excerpt}</p>}
          <p className="text-sm text-muted-foreground">
            {formatDate(hero.publishedAt)} · {hero.readingMinutes} phút đọc
          </p>
        </div>
      </Link>

      <section>
        <SectionHeading title="Mới cập nhật" />
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(0, 6).map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>

      {gomLink.length > 0 && (
        <section>
          <SectionHeading title="Gom link đồ xinh" href={`/${CATEGORIES.GOM_LINK.slug}`} />
          <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
            {gomLink.map((p) => (
              <div key={p.slug} className="w-64 shrink-0 snap-start sm:w-72">
                <PostCard post={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {meoVat.length > 0 && (
        <section>
          <SectionHeading title="Mẹo vặt hay" href={`/${CATEGORIES.MEO_VAT.slug}`} />
          <div className="grid divide-y sm:grid-cols-2 sm:gap-x-10 sm:divide-y-0">
            {meoVat.map((p) => (
              <div key={p.slug} className="sm:border-b">
                <PostListItem post={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
