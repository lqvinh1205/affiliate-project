import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/platform/db";
import type { CategoryKey } from "@/lib/categories";
import { readingMinutes } from "@/platform/html/content";

// Mọi truy vấn bài public gắn tag "posts"; khi publish/sửa bài gọi revalidateTag("posts").
export const POSTS_TAG = "posts";

const cardSelect = {
  slug: true,
  title: true,
  excerpt: true,
  featuredImage: true,
  category: true,
  content: true,
  publishedAt: true,
  products: { select: { image: true }, orderBy: { sortOrder: "asc" }, take: 1 },
} as const;

type CardRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: CategoryKey;
  content: string;
  publishedAt: Date | null;
  products: { image: string | null }[];
};

function toCard({ content, products, ...p }: CardRow) {
  return {
    ...p,
    featuredImage: p.featuredImage ?? products[0]?.image ?? null,
    readingMinutes: readingMinutes(content),
  };
}

export type PostCard = ReturnType<typeof toCard>;

const published = { status: "PUBLISHED" } as const;
const newestFirst = { publishedAt: "desc" } as const;

export async function getLatestPosts(limit: number) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);
  const rows = await db.post.findMany({
    where: published,
    orderBy: newestFirst,
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

export async function getPostsByCategory(category: CategoryKey, limit?: number) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);
  const rows = await db.post.findMany({
    where: { ...published, category },
    orderBy: newestFirst,
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

export async function getRelatedPosts(slug: string, category: CategoryKey, limit = 3) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);
  const rows = await db.post.findMany({
    where: { ...published, category, slug: { not: slug } },
    orderBy: newestFirst,
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

export async function getPostBySlug(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);
  const post = await db.post.findFirst({
    where: { ...published, slug },
    include: { products: { orderBy: { sortOrder: "asc" } } },
  });
  if (!post) return null;
  return {
    ...post,
    featuredImage: post.featuredImage ?? post.products[0]?.image ?? null,
    readingMinutes: readingMinutes(post.content),
  };
}

export async function getPublishedSlugs() {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);
  return db.post.findMany({
    where: published,
    orderBy: newestFirst,
    select: { slug: true, category: true, updatedAt: true },
  });
}
