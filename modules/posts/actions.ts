"use server";

import { updateTag } from "next/cache";
import type { z } from "zod";
import type { Status } from "@/generated/prisma/enums";
import { ask } from "@/platform/ai/ask";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import { CATEGORIES_TAG } from "@/modules/categories/tags";
import {
  POST_EXCERPT_MAX,
  POST_SEO_DESCRIPTION_MAX,
  POST_SEO_TITLE_MAX,
  POST_TITLE_MAX,
} from "@/modules/posts/constants";
import { seoReviewPrompt } from "@/modules/posts/prompts/seo-review.prompt";
import { webPostPrompt } from "@/modules/posts/prompts/web-post.prompt";
import {
  deletePostInputSchema,
  newPostInputSchema,
  postDraftInputSchema,
  postInputSchema,
  seoCheckInputSchema,
  setPostStatusInputSchema,
  toCommaListValue,
  type NewPostFormValues,
  type PostDraftFormValues,
  type PostFormValues,
  type SeoCheckInput,
} from "@/modules/posts/schema";
import { createPostDraftRecord, deletePostRecord, savePostRecord, setPostStatusRecord } from "@/modules/posts/service";
import { POSTS_TAG } from "@/modules/posts/tags";

// Mọi ghi Bài web làm đổi trang bài, danh sách, Trang chủ (tag `posts`) và Danh mục có/hết bài đã xuất bản
// (điều hướng site, trang Danh mục — tag `categories`) (AD-7). Sản phẩm trong Kho không đổi: không cần tag `products`.
function refreshPublicPages() {
  updateTag(POSTS_TAG);
  updateTag(CATEGORIES_TAG);
}

// Tạo bài nháp mới từ giá trị đủ trường (bản trống hoặc bản AI viết — `createPost` gọi action này). Nháp không có trên site: không cần `updateTag`.
export async function createPostDraft(input: PostDraftFormValues): Promise<Result<{ id: string; slug: string }>> {
  return run(async () => {
    const parsed = postDraftInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    return createPostDraftRecord(parsed.data);
  });
}

// Tạo Bài web mới (`/cms/bai-viet/moi`): bản nháp trống (chủ đề làm tiêu đề) hoặc AI viết theo chủ đề.
// Chuyển từ `app/cms/actions.ts` (Story 4.1), hành vi giữ nguyên tới khi Epic 5 thay nhánh AI bằng gợi ý `WEB_POST`
// (AD-9, AD-19). Bản AI được chuẩn hoá về giới hạn của Bài web thay vì bị từ chối; HTML sanitize ở service (AD-22).
export async function createPost(input: NewPostFormValues): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = newPostInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { postType, categoryId, topic, useAi } = parsed.data;
    const base = { slug: "", featuredImage: "", postType, categoryId: categoryId ?? "" };

    let draft: PostDraftFormValues;
    if (useAi) {
      const { data: ai } = await ask({ prompt: webPostPrompt, input: { postType, topic } });
      draft = {
        ...base,
        title: ai.title.trim().slice(0, POST_TITLE_MAX),
        excerpt: ai.excerpt.trim().slice(0, POST_EXCERPT_MAX),
        seoTitle: ai.seoTitle.trim().slice(0, POST_SEO_TITLE_MAX),
        seoDescription: ai.seoDescription.trim().slice(0, POST_SEO_DESCRIPTION_MAX),
        tags: toCommaListValue(ai.tags),
        seoKeywords: toCommaListValue(ai.seoKeywords),
        content: ai.content,
      };
    } else {
      draft = { ...base, title: topic || "Bài viết mới", excerpt: "", seoTitle: "", seoDescription: "", tags: "", seoKeywords: "", content: "" };
    }

    const res = await createPostDraft(draft);
    if (!res.ok) throw new UserError(useAi ? `Chưa lưu được bản nháp AI: ${res.error}` : res.error);
    return { id: res.id };
  });
}

// Chấm điểm SEO bằng AI (FR-13, UX-DR52). Ngoại lệ có tên của AD-9: trả báo cáo cho màn hình, không lưu,
// không tạo `Suggestion`, không `updateTag`.
export async function checkPostSeo(
  input: SeoCheckInput,
): Promise<Result<{ report: { score: number; suggestions: string[] } }>> {
  return run(async () => {
    const parsed = seoCheckInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { data } = await ask({ prompt: seoReviewPrompt, input: parsed.data });
    const score = Math.max(0, Math.min(100, Math.round(data.score)));
    const suggestions = data.suggestions.map((s) => s.trim()).filter(Boolean);
    return { report: { score, suggestions } };
  });
}

export async function savePost(input: PostFormValues): Promise<Result<{ id: string; slug: string }>> {
  return run(async () => {
    const parsed = postInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await savePostRecord(parsed.data);
    refreshPublicPages();
    return saved;
  });
}

export async function setPostStatus(
  input: z.input<typeof setPostStatusInputSchema>,
): Promise<Result<{ id: string; status: Status }>> {
  return run(async () => {
    const parsed = setPostStatusInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await setPostStatusRecord(parsed.data);
    refreshPublicPages();
    return saved;
  });
}

export async function deletePost(input: z.input<typeof deletePostInputSchema>): Promise<Result> {
  return run(async () => {
    const parsed = deletePostInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    await deletePostRecord(parsed.data);
    refreshPublicPages();
    return {};
  });
}
