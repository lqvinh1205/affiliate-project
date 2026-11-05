import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import type { PostType } from "@/generated/prisma/enums";
import { db } from "@/platform/db";
import { readingMinutes } from "@/platform/html/content";
import { CATEGORIES_TAG } from "@/modules/categories/tags";
import { publicProductSelect, visibleProductWhere } from "@/modules/products/queries";
import { PRODUCTS_TAG } from "@/modules/products/tags";
import { PAGE_SIZE } from "@/modules/posts/constants";
import { POSTS_TAG } from "@/modules/posts/tags";

// Query public của Bài web (spine AD-7): `"use cache"` + `cacheLife` + `cacheTag` của mọi module có bảng
// được đọc. Chỉ Bài web đã xuất bản; Sản phẩm chỉ qua `visibleProductWhere` + `publicProductSelect`.

const published = { status: "PUBLISHED" } as const;
const newestFirst = [{ publishedAt: "desc" }, { id: "desc" }] as const;

// Ảnh đại diện fallback = ảnh Sản phẩm đang hiện đầu tiên của bài.
const firstVisibleProduct = {
  where: { product: visibleProductWhere },
  orderBy: { sortOrder: "asc" },
  take: 1,
  select: { product: { select: publicProductSelect } },
} as const;

const cardSelect = {
  slug: true,
  title: true,
  excerpt: true,
  featuredImage: true,
  postType: true,
  content: true,
  publishedAt: true,
  postProducts: firstVisibleProduct,
} as const satisfies Prisma.PostSelect;

type CardRow = Prisma.PostGetPayload<{ select: typeof cardSelect }>;

function toCard({ content, postProducts, ...p }: CardRow) {
  return {
    ...p,
    featuredImage: p.featuredImage ?? postProducts[0]?.product.image ?? null,
    readingMinutes: readingMinutes(content),
  };
}

function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export async function getLatestPosts(limit: number) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG, PRODUCTS_TAG);
  const rows = await db.post.findMany({ where: published, orderBy: [...newestFirst], take: limit, select: cardSelect });
  return rows.map(toCard);
}

export async function getPostsByType(postType: PostType, limit?: number) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG, PRODUCTS_TAG);
  const rows = await db.post.findMany({
    where: { ...published, postType },
    orderBy: [...newestFirst],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

export async function getRelatedPosts(slug: string, postType: PostType, limit = 3) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG, PRODUCTS_TAG);
  const rows = await db.post.findMany({
    where: { ...published, postType, slug: { not: slug } },
    orderBy: [...newestFirst],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

// Bài public kèm Sản phẩm đang hiện và Danh mục (breadcrumb theo Danh mục — AD-26).
export async function getPostBySlug(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG, PRODUCTS_TAG, CATEGORIES_TAG);
  const post = await db.post.findFirst({
    where: { ...published, slug },
    include: {
      category: { select: { name: true, slug: true } },
      postProducts: {
        where: { product: visibleProductWhere },
        orderBy: { sortOrder: "asc" },
        select: { product: { select: publicProductSelect } },
      },
    },
  });
  if (!post) return null;
  const { postProducts, ...rest } = post;
  const products = postProducts.map((pp) => pp.product);
  return {
    ...rest,
    products,
    featuredImage: post.featuredImage ?? products[0]?.image ?? null,
    readingMinutes: readingMinutes(post.content),
  };
}

export async function getPublishedSlugs() {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);
  return db.post.findMany({
    where: published,
    orderBy: [...newestFirst],
    select: { slug: true, postType: true, updatedAt: true },
  });
}

// Mọi Danh mục theo thứ tự hiển thị kèm số Bài web đã xuất bản (route `[danh-muc]`, sitemap, điều hướng).
// Đặt ở `posts` vì chạm bảng `Post` + `Category` (spine AD-2).
export async function listCategoriesWithPostCounts() {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG, CATEGORIES_TAG);
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { name: true, slug: true, updatedAt: true, _count: { select: { posts: { where: published } } } },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, posts: _count.posts, pages: pageCount(_count.posts) }));
}

// Danh mục cho điều hướng site (CategorySheet, nav desktop, footer): chỉ Danh mục có ≥ 1 Bài web đã xuất bản.
export async function listNavCategories() {
  const all = await listCategoriesWithPostCounts();
  return all.filter((c) => c.posts > 0).map(({ name, slug }) => ({ name, slug }));
}

// Một trang Bài web đã xuất bản của Danh mục / Loại bài; `page` từ 1, trang vượt quá trả `items` rỗng.
async function listPublishedPage(where: { categoryId: string } | { postType: PostType }, page: number) {
  const filter = { ...published, ...where };
  const [rows, total] = await Promise.all([
    db.post.findMany({
      where: filter,
      orderBy: [...newestFirst],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: cardSelect,
    }),
    db.post.count({ where: filter }),
  ]);
  return { items: rows.map(toCard), total, pages: pageCount(total) };
}

export async function listPostsByCategory(categoryId: string, page: number) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG, CATEGORIES_TAG, PRODUCTS_TAG);
  return listPublishedPage({ categoryId }, page);
}

export async function listPostsByType(postType: PostType, page: number) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG, PRODUCTS_TAG);
  return listPublishedPage({ postType }, page);
}
