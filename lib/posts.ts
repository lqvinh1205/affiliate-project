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
  postType: true,
  content: true,
  publishedAt: true,
  postProducts: { select: { product: { select: { image: true } } }, orderBy: { sortOrder: "asc" }, take: 1 },
} as const;

type CardRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  postType: CategoryKey;
  content: string;
  publishedAt: Date | null;
  postProducts: { product: { image: string | null } }[];
};

function toCard({ content, postType, postProducts, ...p }: CardRow) {
  return {
    ...p,
    category: postType,
    featuredImage: p.featuredImage ?? postProducts[0]?.product.image ?? null,
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
    where: { ...published, postType: category },
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
    where: { ...published, postType: category, slug: { not: slug } },
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
    include: { postProducts: { orderBy: { sortOrder: "asc" }, include: { product: true } } },
  });
  if (!post) return null;
  const { postType, postProducts, ...rest } = post;
  const products = postProducts.map((pp) => pp.product);
  return {
    ...rest,
    category: postType,
    products,
    featuredImage: post.featuredImage ?? products[0]?.image ?? null,
    readingMinutes: readingMinutes(post.content),
  };
}

export async function getPublishedSlugs() {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);
  const rows = await db.post.findMany({
    where: published,
    orderBy: newestFirst,
    select: { slug: true, postType: true, updatedAt: true },
  });
  return rows.map(({ postType, ...r }) => ({ ...r, category: postType }));
}
