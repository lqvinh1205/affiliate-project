"use server";

import { updateTag } from "next/cache";
import { db } from "@/lib/db";
import { analyzeSeo, generatePost, toThreads, type SeoReport } from "@/lib/ai";
import { POSTS_TAG } from "@/lib/posts";
import {
  firstError,
  newPostSchema,
  postInputSchema,
  type NewPostInput,
  type PostInput,
} from "@/lib/post-input";
import { requireAdmin } from "@/lib/require-admin";
import { sanitizePostHtml } from "@/lib/sanitize";
import { SITE_URL } from "@/lib/site";
import { slugify } from "@/lib/slug";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function run<T extends object>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    await requireAdmin();
    return { ok: true, ...(await fn()) };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra" };
  }
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "bai-viet";
  for (let i = 1; ; i++) {
    const slug = i === 1 ? root : `${root}-${i}`;
    const hit = await db.post.findFirst({ where: { slug, NOT: { id: excludeId } }, select: { id: true } });
    if (!hit) return slug;
  }
}

const productRows = (products: { name: string; image: string | null; price: string | null; affiliateUrl: string }[]) =>
  products.map((p, sortOrder) => ({ ...p, sortOrder }));

export async function createPost(input: NewPostInput) {
  return run(async () => {
    const parsed = newPostSchema.safeParse(input);
    if (!parsed.success) throw new Error(firstError(parsed.error));
    const { category, topic, products, useAi } = parsed.data;

    let data;
    if (useAi) {
      if (products.length === 0) throw new Error("Cần ít nhất 1 sản phẩm để AI viết bài");
      const draft = await generatePost({ category, topic, products });
      data = {
        ...draft,
        excerpt: draft.excerpt.slice(0, 500),
        content: sanitizePostHtml(draft.content),
        slug: await uniqueSlug(draft.title),
      };
    } else {
      const title = topic || "Bài viết mới";
      data = { title, content: "", tags: [], seoKeywords: [], slug: await uniqueSlug(title) };
    }

    const post = await db.post.create({
      data: { ...data, category, products: { create: productRows(products) } },
      select: { id: true },
    });
    return { id: post.id };
  });
}

export async function savePost(id: string, input: PostInput) {
  return run(async () => {
    const parsed = postInputSchema.safeParse(input);
    if (!parsed.success) throw new Error(firstError(parsed.error));
    const { products, slug, content, ...rest } = parsed.data;

    const post = await db.post.update({
      where: { id },
      data: {
        ...rest,
        content: sanitizePostHtml(content),
        slug: await uniqueSlug(slug || rest.title, id),
        products: { deleteMany: {}, create: productRows(products) },
      },
      select: { slug: true },
    });
    updateTag(POSTS_TAG);
    return { slug: post.slug };
  });
}

export async function setPostStatus(id: string, status: "DRAFT" | "PUBLISHED") {
  return run(async () => {
    const current = await db.post.findUniqueOrThrow({ where: { id }, select: { publishedAt: true, content: true } });
    if (status === "PUBLISHED" && !current.content.trim()) {
      throw new Error("Bài chưa có nội dung, chưa thể xuất bản");
    }
    await db.post.update({
      where: { id },
      data: {
        status,
        // Giữ ngày đăng gốc khi gỡ rồi đăng lại.
        publishedAt: status === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt,
      },
    });
    updateTag(POSTS_TAG);
    return {};
  });
}

export async function deletePost(id: string) {
  return run(async () => {
    await db.post.delete({ where: { id } });
    updateTag(POSTS_TAG);
    return {};
  });
}

export async function runSeoCheck(input: {
  title: string;
  seoTitle: string;
  seoDescription: string;
  content: string;
  keywords: string[];
}): Promise<Result<{ report: SeoReport }>> {
  return run(async () => ({ report: await analyzeSeo(input) }));
}

export async function runThreads(input: { title: string; content: string; slug: string }) {
  return run(async () => ({
    posts: await toThreads({ ...input, url: `${SITE_URL}/bai-viet/${input.slug}` }),
  }));
}
