"use server";

import { analyzeSeo, generatePost, toThreads, type SeoReport } from "@/lib/ai";
import { Prisma } from "@/generated/prisma/client";
import { newPostSchema, postDraftSchema, type NewPostInput } from "@/modules/posts/schema";
import { freePostSlug } from "@/modules/posts/service";
import { run } from "@/platform/auth/run";
import { db } from "@/platform/db";
import { UserError, type Result } from "@/platform/errors";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import { SITE_URL } from "@/platform/site";
import { firstError } from "@/platform/validation/errors";

// Chỉ còn các action AI cũ, giữ nguyên chỗ tới Epic 4 (`platform/ai`). Ghi Bài web (`savePost`, `setPostStatus`,
// `deletePost`) đã chuyển sang `modules/posts/actions.ts`.

const CATEGORY_GONE = "Danh mục đã chọn không còn tồn tại. Tải lại trang rồi chọn lại.";

// Ghi bài; Danh mục bị xoá giữa chừng (FK P2003) → UserError tiếng Việt.
async function withCategoryCheck<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") throw new UserError(CATEGORY_GONE);
    throw e;
  }
}

export async function createPost(input: NewPostInput) {
  return run(async () => {
    const parsed = newPostSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { postType, categoryId, topic, useAi } = parsed.data;

    let data;
    if (useAi) {
      // Bài mới không nhận Sản phẩm (gắn từ Kho trong trình soạn): AI viết theo chủ đề.
      if (!topic) throw new UserError("Nhập chủ đề để AI viết bài");
      const draft = await generatePost({ category: postType, topic });
      // Bản nháp AI qua cùng schema với bài viết tay.
      const checked = postDraftSchema.safeParse({
        ...draft,
        tags: draft.tags.join(", "),
        seoKeywords: draft.seoKeywords.join(", "),
        slug: "",
        excerpt: draft.excerpt.slice(0, 500),
        featuredImage: "",
        postType,
        categoryId: categoryId ?? "",
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
        slug: await freePostSlug(db, title),
      };
    } else {
      const title = topic || "Bài viết mới";
      data = { title, content: "", tags: [], seoKeywords: [], slug: await freePostSlug(db, title) };
    }

    // Bài mới luôn là nháp: không có trên site, không cần updateTag.
    const post = await withCategoryCheck(() =>
      db.post.create({ data: { ...data, postType, categoryId }, select: { id: true } }),
    );
    return { id: post.id };
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
