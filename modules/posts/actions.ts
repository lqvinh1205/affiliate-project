"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import type { z } from "zod";
import type { Status } from "@/generated/prisma/enums";
import { AI_BAD_OUTPUT, ask } from "@/platform/ai/ask";
import { visibleText } from "@/platform/html/content";
import { run } from "@/platform/auth/run";
import { INVALID_INPUT_ERROR, RATE_LIMITED_ERROR, UNEXPECTED_ERROR, UserError, type Result } from "@/platform/errors";
import { clientKey, createRateLimiter } from "@/platform/rate-limit";
import { firstError } from "@/platform/validation/errors";
import { CATEGORIES_TAG } from "@/modules/categories/tags";
import { getStyleProfileForCms } from "@/modules/style-profiles/cms-queries";
import { IMPORT_NO_WEB, IMPORT_UNREADABLE, REWRITE_EMPTY, SEARCH_RATE_LIMIT } from "@/modules/posts/constants";
import { importPostPrompt, toImportedPost } from "@/modules/posts/prompts/import-post.prompt";
import { rewritePostPrompt, toRewrittenPost } from "@/modules/posts/prompts/rewrite-post.prompt";
import { seoReviewPrompt } from "@/modules/posts/prompts/seo-review.prompt";
import {
  deletePostInputSchema,
  importPostInputSchema,
  newPostInputSchema,
  postDraftInputSchema,
  postInputSchema,
  rewritePostInputSchema,
  searchPostsInputSchema,
  seoCheckInputSchema,
  setPostStatusInputSchema,
  type ImportPostInput,
  type NewPostFormValues,
  type PostDraftFormValues,
  type PostFormValues,
  type RewritePostInput,
  type SeoCheckInput,
} from "@/modules/posts/schema";
import {
  createPostDraftRecord,
  deletePostRecord,
  savePostRecord,
  searchPostsRecord,
  setPostStatusRecord,
} from "@/modules/posts/service";
import { POSTS_TAG } from "@/modules/posts/tags";
import type { ImportedPost, RewrittenPost, SearchPostItem } from "@/modules/posts/types";

// Mọi ghi Bài web làm đổi trang bài, danh sách, Trang chủ (tag `posts`) và Danh mục có/hết bài đã xuất bản
// (điều hướng site, trang Danh mục — tag `categories`) (AD-7). Sản phẩm trong Kho không đổi: không cần tag `products`.
function refreshPublicPages() {
  updateTag(POSTS_TAG);
  updateTag(CATEGORIES_TAG);
}

// Tạo bài nháp mới từ giá trị đủ trường (`createPost` gọi action này). Nháp không có trên site: không cần `updateTag`.
export async function createPostDraft(input: PostDraftFormValues): Promise<Result<{ id: string; slug: string }>> {
  return run(async () => {
    const parsed = postDraftInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    return createPostDraftRecord(parsed.data);
  });
}

// Tạo Bài web mới bằng tay (`/cms/bai-viet/moi`): bản nháp trống, chủ đề làm tiêu đề. Bài web do AI viết đi qua Bộ
// nội dung (gợi ý `WEB_POST`, Story 5.2); nhánh AI cũ đã gỡ theo `docs/cong-thuc/bo-chuc-nang.md`.
export async function createPost(input: NewPostFormValues): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = newPostInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { postType, categoryId, topic } = parsed.data;
    const res = await createPostDraft({
      slug: "",
      featuredImage: "",
      postType,
      categoryId: categoryId ?? "",
      title: topic || "Bài viết mới",
      excerpt: "",
      seoTitle: "",
      seoDescription: "",
      tags: "",
      seoKeywords: "",
      content: "",
    });
    if (!res.ok) throw new UserError(res.error);
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

// Nhập Bài web từ URL (FR-39). Ngoại lệ có tên của AD-9 (như `checkPostSeo`): chạy đồng bộ, trả nội dung cho form,
// không lưu, không tạo `Suggestion`, không `updateTag`. Máy chủ không tự tải URL: chỉ chuyển cho AI trong prompt và
// nhà AI tự đọc trang (`webSearch`). Nhà không đọc web được (`sources` không có) → IMPORT_NO_WEB; có đọc mà không ra
// nguồn nào → IMPORT_UNREADABLE.
export async function importPostFromUrl(
  input: ImportPostInput,
): Promise<Result<ImportedPost>> {
  return run(async () => {
    const parsed = importPostInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const res = await ask({ prompt: importPostPrompt, input: parsed.data, webSearch: true });
    if (res.sources === undefined) throw new UserError(IMPORT_NO_WEB);
    // Đọc web mà không ra nguồn nào: nhiều khả năng AI không đọc được trang.
    if (res.sources.length === 0) throw new UserError(IMPORT_UNREADABLE);
    const imported = toImportedPost(res.data);
    if (!imported) throw new UserError(IMPORT_UNREADABLE);
    return imported;
  });
}

// AI chỉnh sửa tiêu đề, tóm tắt, thân bài đang soạn (FR-40) theo Hồ sơ phong cách Website, kèm Cảnh báo rủi ro.
// Ngoại lệ có tên của AD-9 như `checkPostSeo`: đồng bộ, không lưu, không `Suggestion`, không `updateTag`.
export async function rewritePostDraft(
  input: RewritePostInput,
): Promise<Result<RewrittenPost>> {
  return run(async () => {
    const parsed = rewritePostInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { title, excerpt, content, instruction } = parsed.data;
    if (!visibleText(content)) throw new UserError(REWRITE_EMPTY);
    const style = await getStyleProfileForCms("WEBSITE");
    const { data } = await ask({
      prompt: rewritePostPrompt,
      input: { title, excerpt, content, instruction: instruction || null },
      style,
    });
    const rewritten = toRewrittenPost(data, { title, excerpt });
    if (!rewritten) throw new UserError(AI_BAD_OUTPUT);
    return rewritten;
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

const searchLimiter = createRateLimiter(SEARCH_RATE_LIMIT);

// Tìm Bài web đã xuất bản (FR-36) — ngoại lệ số 2 của AD-6 ([QD-20]): action **chỉ đọc** công khai, không
// `run()`/`requireAdmin()`; validate; giới hạn tần suất theo băm IP trong bộ nhớ (AD-23); chỉ Bài web đã xuất bản;
// không ghi log từ khoá hay định danh (NFR-7) — vì vậy không `console.error`. Ngày đăng qua ranh giới client là chuỗi
// ISO (AD-8).
export async function searchPosts(
  input: z.input<typeof searchPostsInputSchema>,
): Promise<Result<{ total: number; terms: string[]; items: SearchPostItem[] }>> {
  const parsed = searchPostsInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_INPUT_ERROR };
  try {
    if (!searchLimiter.hit(clientKey(await headers()))) return { ok: false, error: RATE_LIMITED_ERROR };
    const { items, total } = await searchPostsRecord(parsed.data.q);
    return {
      ok: true,
      total,
      terms: parsed.data.q,
      items: items.map((p) => ({ ...p, publishedAt: p.publishedAt?.toISOString() ?? null })),
    };
  } catch {
    return { ok: false, error: UNEXPECTED_ERROR };
  }
}
