"use server";

import { updateTag } from "next/cache";
import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { analyzeSeo, generatePost, toThreads, type SeoReport } from "@/lib/ai";
import { POSTS_TAG } from "@/lib/posts";
import {
  newPostSchema,
  postInputSchema,
  productInputSchema,
  type NewPostInput,
  type PostInput,
} from "@/lib/post-input";
import { run } from "@/platform/auth/run";
import { db } from "@/platform/db";
import { UserError, type Result } from "@/platform/errors";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import { SITE_URL } from "@/platform/site";
import { slugify } from "@/platform/slug";
import { firstError } from "@/platform/validation/errors";

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "bai-viet";
  for (let i = 1; ; i++) {
    const slug = i === 1 ? root : `${root}-${i}`;
    const hit = await db.post.findFirst({ where: { slug, NOT: { id: excludeId } }, select: { id: true } });
    if (!hit) return slug;
  }
}

type ProductRow = z.output<typeof productInputSchema>;

// Thay danh sách Sản phẩm của bài theo thứ tự form; Sản phẩm vừa gỡ mà không còn bài nào dùng thì xoá.
async function replacePostProducts(tx: Prisma.TransactionClient, postId: string, products: ProductRow[]) {
  const old = await tx.postProduct.findMany({ where: { postId }, select: { productId: true } });
  await tx.postProduct.deleteMany({ where: { postId } });
  await tx.product.deleteMany({
    where: { id: { in: old.map((o) => o.productId) }, postProducts: { none: {} } },
  });
  const rows = products.map((p) => ({ ...p, id: crypto.randomUUID() }));
  await tx.product.createMany({ data: rows });
  await tx.postProduct.createMany({
    data: rows.map((p, sortOrder) => ({ postId, productId: p.id, sortOrder })),
  });
}

export async function createPost(input: NewPostInput) {
  return run(async () => {
    const parsed = newPostSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { category, topic, products, useAi } = parsed.data;

    let data;
    if (useAi) {
      if (products.length === 0) throw new UserError("Cần ít nhất 1 sản phẩm để AI viết bài");
      const draft = await generatePost({ category, topic, products });
      // Bản nháp AI qua cùng schema với bài viết tay.
      const nonEmpty = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);
      const checked = postInputSchema.safeParse({
        ...draft,
        tags: nonEmpty(draft.tags),
        seoKeywords: nonEmpty(draft.seoKeywords),
        slug: "",
        excerpt: draft.excerpt.slice(0, 500),
        featuredImage: "",
        category,
        products: input.products,
      });
      if (!checked.success) throw new UserError(`AI trả về bản nháp chưa hợp lệ: ${firstError(checked.error)}`);
      const { title, excerpt, seoTitle, seoDescription, tags, seoKeywords, content } = checked.data;
      data = {
        title,
        excerpt,
        seoTitle,
        seoDescription,
        tags,
        seoKeywords,
        content: sanitizePostHtml(content),
        slug: await uniqueSlug(title),
      };
    } else {
      const title = topic || "Bài viết mới";
      data = { title, content: "", tags: [], seoKeywords: [], slug: await uniqueSlug(title) };
    }

    const post = await db.$transaction(async (tx) => {
      const created = await tx.post.create({ data: { ...data, postType: category }, select: { id: true } });
      await replacePostProducts(tx, created.id, products);
      return created;
    });
    return { id: post.id };
  });
}

export async function savePost(id: string, input: PostInput) {
  return run(async () => {
    const parsed = postInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { products, slug, content, category, ...rest } = parsed.data;
    const uniq = await uniqueSlug(slug || rest.title, id);

    const post = await db.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id },
        data: { ...rest, postType: category, content: sanitizePostHtml(content), slug: uniq },
        select: { slug: true },
      });
      await replacePostProducts(tx, id, products);
      return updated;
    });
    updateTag(POSTS_TAG);
    return { slug: post.slug };
  });
}

export async function setPostStatus(id: string, status: "DRAFT" | "PUBLISHED") {
  return run(async () => {
    const current = await db.post.findUnique({ where: { id }, select: { publishedAt: true, content: true } });
    if (!current) throw new UserError("Không tìm thấy bài viết");
    if (status === "PUBLISHED" && !current.content.trim()) {
      throw new UserError("Bài chưa có nội dung, chưa thể xuất bản");
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
    await db.$transaction(async (tx) => {
      await replacePostProducts(tx, id, []);
      await tx.post.delete({ where: { id } });
    });
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
