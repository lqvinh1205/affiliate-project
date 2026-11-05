"use server";

import { analyzeSeo, generatePost, toThreads, type SeoReport } from "@/lib/ai";
import { createPostDraft } from "@/modules/posts/actions";
import {
  POST_EXCERPT_MAX,
  POST_SEO_DESCRIPTION_MAX,
  POST_SEO_TITLE_MAX,
  POST_TITLE_MAX,
} from "@/modules/posts/constants";
import { newPostInputSchema, toCommaListValue, type NewPostFormValues } from "@/modules/posts/schema";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { SITE_URL } from "@/platform/site";
import { firstError } from "@/platform/validation/errors";

// Chỉ còn các action AI cũ, giữ nguyên chỗ tới Epic 4 (`platform/ai`). Ghi Bài web nằm ở `modules/posts/actions.ts`:
// `createPost` chỉ lo phần AI rồi gọi `createPostDraft` để ghi bản nháp.

export async function createPost(input: NewPostFormValues): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = newPostInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { postType, categoryId, topic, useAi } = parsed.data;
    const base = { slug: "", featuredImage: "", postType, categoryId: categoryId ?? "" };

    let draft;
    if (useAi) {
      // Bài mới không nhận Sản phẩm (gắn từ Kho trong trình soạn): AI viết theo chủ đề. Bản AI được chuẩn hoá về
      // giới hạn của Bài web thay vì bị từ chối.
      const ai = await generatePost({ category: postType, topic });
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
      draft = {
        ...base,
        title: topic || "Bài viết mới",
        excerpt: "",
        seoTitle: "",
        seoDescription: "",
        tags: "",
        seoKeywords: "",
        content: "",
      };
    }

    // Bài mới luôn là nháp: không có trên site, không cần updateTag.
    const res = await createPostDraft(draft);
    if (!res.ok) throw new UserError(useAi ? `Chưa lưu được bản nháp AI: ${res.error}` : res.error);
    return { id: res.id };
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
