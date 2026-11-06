import { z } from "zod";
import { SOCIAL_POST_URL_MAX } from "@/modules/content-sets/constants";

const socialPostId = z.string().min(1, "Thiếu bài mạng xã hội");

// Sửa Bài Threads / Facebook đã Duyệt (FR-22: sửa đích không cần Duyệt lại). Nội dung theo nền tảng của bài —
// service parse bằng Zod payload của nền tảng (`threadsApprovalSchema` / `facebookPayloadSchema`).
export const saveSocialPostInputSchema = z.object({ id: socialPostId, content: z.unknown() });

// Sửa Bình luận kèm link đã Duyệt; nội dung parse bằng `linkCommentPayloadSchema`.
export const saveLinkCommentInputSchema = z.object({ id: socialPostId, content: z.unknown() });

// Sao chép bài đã Duyệt (FR-19, AD-21): ghi `SocialPost.firstCopiedAt` lần đầu.
export const recordCopyInputSchema = z.object({ id: socialPostId });

function isHttpUrl(s: string) {
  try {
    return /^https?:$/.test(new URL(s).protocol);
  } catch {
    return false;
  }
}

// Đánh dấu đã đăng (FR-20, UX-DR56): link bài đăng tuỳ chọn, phải là URL http(s).
export const markPostedInputSchema = z.object({
  id: socialPostId,
  postUrl: z
    .string()
    .trim()
    .max(SOCIAL_POST_URL_MAX, `Tối đa ${SOCIAL_POST_URL_MAX} ký tự`)
    .refine((s) => !s || isHttpUrl(s), "Link bài đăng phải bắt đầu bằng http:// hoặc https://")
    .transform((s) => s || null),
});

export const unmarkPostedInputSchema = z.object({ id: socialPostId });

export type SaveSocialPostInput = z.input<typeof saveSocialPostInputSchema>;
export type SaveLinkCommentInput = z.input<typeof saveLinkCommentInputSchema>;
export type RecordCopyInput = z.input<typeof recordCopyInputSchema>;
export type MarkPostedFormValues = z.input<typeof markPostedInputSchema>;
export type UnmarkPostedInput = z.input<typeof unmarkPostedInputSchema>;
