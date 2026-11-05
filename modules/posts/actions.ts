"use server";

import { updateTag } from "next/cache";
import type { z } from "zod";
import type { Status } from "@/generated/prisma/enums";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import { CATEGORIES_TAG } from "@/modules/categories/tags";
import {
  deletePostInputSchema,
  postDraftInputSchema,
  postInputSchema,
  setPostStatusInputSchema,
  type PostDraftFormValues,
  type PostFormValues,
} from "@/modules/posts/schema";
import { createPostDraftRecord, deletePostRecord, savePostRecord, setPostStatusRecord } from "@/modules/posts/service";
import { POSTS_TAG } from "@/modules/posts/tags";

// Mọi ghi Bài web làm đổi trang bài, danh sách, Trang chủ (tag `posts`) và Danh mục có/hết bài đã xuất bản
// (điều hướng site, trang Danh mục — tag `categories`) (AD-7). Sản phẩm trong Kho không đổi: không cần tag `products`.
function refreshPublicPages() {
  updateTag(POSTS_TAG);
  updateTag(CATEGORIES_TAG);
}

// Tạo bài nháp mới (bản trống hoặc bản AI viết — action AI cũ `createPost` gọi action này). Nháp không có trên site:
// không cần `updateTag`.
export async function createPostDraft(input: PostDraftFormValues): Promise<Result<{ id: string; slug: string }>> {
  return run(async () => {
    const parsed = postDraftInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    return createPostDraftRecord(parsed.data);
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
