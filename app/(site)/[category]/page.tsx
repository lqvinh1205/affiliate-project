import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/site/post-card";
import { CATEGORIES, categoryFromSlug } from "@/lib/categories";
import { getPostsByCategory } from "@/lib/posts";

export function generateStaticParams() {
  return Object.values(CATEGORIES).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[category]">): Promise<Metadata> {
  const key = categoryFromSlug((await params).category);
  if (!key) return {};
  const c = CATEGORIES[key];
  return {
    title: c.label,
    description: c.description,
    alternates: { canonical: `/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const key = categoryFromSlug((await params).category);
  if (!key) notFound();
  const c = CATEGORIES[key];
  const posts = await getPostsByCategory(key);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-10 border-b pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Chuyên mục</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{c.label}</h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">{c.description}</p>
      </header>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">Chưa có bài viết trong chuyên mục này.</p>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
