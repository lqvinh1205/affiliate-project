"use server";

import { updateTag } from "next/cache";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import { getSocialPostForCms } from "@/modules/content-sets/cms-queries";
import { facebookPayloadSchema } from "@/modules/content-sets/prompts/facebook-post.prompt";
import { linkCommentPayloadSchema } from "@/modules/content-sets/prompts/link-comment.prompt";
import { threadsApprovalSchema } from "@/modules/content-sets/prompts/threads-post.prompt";
import {
  markPostedInputSchema,
  recordCopyInputSchema,
  saveLinkCommentInputSchema,
  saveSocialPostInputSchema,
  unmarkPostedInputSchema,
  type MarkPostedFormValues,
  type RecordCopyInput,
  type SaveLinkCommentInput,
  type SaveSocialPostInput,
  type UnmarkPostedInput,
} from "@/modules/content-sets/schema";
import {
  markPostedRecord,
  recordCopyRecord,
  saveLinkCommentRecord,
  saveSocialPostRecord,
} from "@/modules/content-sets/service";
import { CONTENT_SETS_TAG } from "@/modules/content-sets/tags";

// Ghi bài mạng xã hội đã Duyệt (đích của gợi ý — AD-19). Duyệt và tạo nằm ở `modules/suggestions/actions.ts` (AD-9).
// Bộ nội dung chỉ hiện trong CMS (không cache); `updateTag(content-sets)` giữ đúng AD-6.

function parse<T>(r: { success: true; data: T } | { success: false; error: import("zod").ZodError }): T {
  if (!r.success) throw new UserError(firstError(r.error));
  return r.data;
}

// Sửa Bài Threads / Facebook đã Duyệt (FR-22): sửa không đổi trạng thái gợi ý.
export async function saveSocialPost(input: SaveSocialPostInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const { id, content } = parse(saveSocialPostInputSchema.safeParse(input));
    const post = await getSocialPostForCms(id);
    if (!post) throw new UserError("Không tìm thấy bài mạng xã hội. Tải lại trang.");
    const parts =
      post.platform === "THREADS"
        ? parse(threadsApprovalSchema.safeParse(content)).posts
        : [parse(facebookPayloadSchema.safeParse(content)).body];
    const saved = await saveSocialPostRecord({ id, parts });
    updateTag(CONTENT_SETS_TAG);
    return saved;
  });
}

// Sửa Bình luận kèm link đã Duyệt.
export async function saveLinkComment(input: SaveLinkCommentInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const { id, content } = parse(saveLinkCommentInputSchema.safeParse(input));
    const { comment } = parse(linkCommentPayloadSchema.safeParse(content));
    const saved = await saveLinkCommentRecord({ id, linkComment: comment });
    updateTag(CONTENT_SETS_TAG);
    return saved;
  });
}

// Sao chép bài / bình luận đã Duyệt (FR-19, AD-21): ghi `SocialPost.firstCopiedAt` lần đầu.
export async function recordCopy(input: RecordCopyInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const saved = await recordCopyRecord(parse(recordCopyInputSchema.safeParse(input)));
    updateTag(CONTENT_SETS_TAG);
    return saved;
  });
}

// Đánh dấu đã đăng kèm link tuỳ chọn (FR-20, UX-DR56).
export async function markPosted(input: MarkPostedFormValues): Promise<Result<{ id: string }>> {
  return run(async () => {
    const saved = await markPostedRecord(parse(markPostedInputSchema.safeParse(input)));
    updateTag(CONTENT_SETS_TAG);
    return saved;
  });
}

// Bỏ đánh dấu đã đăng.
export async function unmarkPosted(input: UnmarkPostedInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const { id } = parse(unmarkPostedInputSchema.safeParse(input));
    const saved = await markPostedRecord({ id, unmark: true });
    updateTag(CONTENT_SETS_TAG);
    return saved;
  });
}
