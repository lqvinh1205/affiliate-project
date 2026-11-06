import { z } from "zod";
import {
  FACEBOOK_POST_MAX,
  LINK_COMMENT_MAX,
  PLATFORM_LABEL,
  SOCIAL_POST_URL_MAX,
  THREADS_PARTS_MAX,
  THREADS_POST_MAX,
  type SocialPlatform,
} from "@/modules/content-sets/constants";

// ---------- Nội dung bài mạng xã hội (gợi ý, Duyệt, sửa sau Duyệt) ----------
// Một nguồn Zod cho server (Duyệt, `saveSocialPost`, `saveLinkComment`, prompt) và form client (`socialContentError`
// ở `components/`) — AD-14: lỗi hiện ở giao diện bằng cùng schema mà server kiểm.

// Link trong chữ (FR-14, FR-15, FR-17): có scheme, bắt đầu `www.`, hoặc tên miền trần (`shope.ee/abc`, `s.shopee.vn/x`,
// `example.com`) — Threads/Facebook tự biến tên miền trần thành link.
const URL_TLDS = "vn|com|net|org|ee|me|ly|co|io|info|link|shop|store|site|online|xyz|app|asia|biz|gl";
export const URL_PATTERN = new RegExp(
  `(?:https?:\\/\\/|www\\.)[^\\s)\\]]+|(?<![\\p{L}\\p{N}_@.-])(?:[a-z0-9-]+\\.)+(?:${URL_TLDS})(?![\\p{L}\\p{N}_-])(?:\\/[^\\s)\\]]*)?`,
  "giu",
);

// Bỏ mọi link khỏi thân bài mạng xã hội (FR-14, FR-15: link chỉ ở Bình luận kèm link).
export function stripUrls(text: string) {
  return text
    .replace(URL_PATTERN, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// Payload gợi ý `THREADS_POST`: đọc/hiện được cả bài > 500 ký tự (bộ đếm đỏ, Duyệt tắt — UX-DR41); Duyệt kiểm bằng
// `threadsApprovalSchema`.
export const threadsPayloadSchema = z.object({
  posts: z.array(z.string().max(THREADS_POST_MAX * 10)).min(1).max(THREADS_PARTS_MAX),
});

// Độ dài một bài Threads như Duyệt kiểm (sau khi bỏ khoảng trắng đầu/cuối) — bộ đếm trên thẻ dùng cùng cách đếm.
export const threadsPostLength = (text: string) => text.trim().length;

// Nội dung Duyệt / sửa sau Duyệt: số bài giữ nguyên (không thêm/xoá bài trong chuỗi), mỗi bài 1–500 ký tự.
export const threadsApprovalSchema = z.object({
  posts: z
    .array(z.string().trim())
    .min(1)
    .max(THREADS_PARTS_MAX)
    .superRefine((posts, ctx) => {
      posts.forEach((p, i) => {
        if (!p) ctx.addIssue({ code: "custom", path: [i], message: `Bài ${i + 1} đang trống` });
        else if (p.length > THREADS_POST_MAX) {
          ctx.addIssue({ code: "custom", path: [i], message: `Bài ${i + 1} vượt ${THREADS_POST_MAX} ký tự` });
        }
      });
    }),
});

export type ThreadsPayload = z.infer<typeof threadsPayloadSchema>;

// Payload gợi ý `FACEBOOK_POST` và nội dung Duyệt / sửa sau Duyệt.
export const facebookPayloadSchema = z.object({
  body: z.string().trim().min(1, "Bài đang trống").max(FACEBOOK_POST_MAX, `Tối đa ${FACEBOOK_POST_MAX} ký tự`),
});

export type FacebookPayload = z.infer<typeof facebookPayloadSchema>;

// Giới hạn Bình luận kèm link theo nền tảng: trên Threads mỗi trả lời cũng tối đa 500 ký tự như bài (FR-14);
// Facebook theo `LINK_COMMENT_MAX` (= cột `SocialPost.linkComment`).
export const linkCommentMax = (platform: SocialPlatform) => (platform === "THREADS" ? THREADS_POST_MAX : LINK_COMMENT_MAX);

// Payload gợi ý `LINK_COMMENT` (đọc được mọi nền tảng); Duyệt / sửa sau Duyệt kiểm thêm giới hạn của nền tảng.
export const linkCommentPayloadSchema = z.object({
  comment: z.string().trim().min(1, "Bình luận đang trống").max(LINK_COMMENT_MAX, `Tối đa ${LINK_COMMENT_MAX} ký tự`),
});

export const linkCommentSchemaFor = (platform: SocialPlatform) =>
  z.object({
    comment: z
      .string()
      .trim()
      .min(1, "Bình luận đang trống")
      .max(linkCommentMax(platform), `Bình luận ${PLATFORM_LABEL[platform]} vượt ${linkCommentMax(platform)} ký tự`),
  });

export type LinkCommentPayload = z.infer<typeof linkCommentPayloadSchema>;

// ---------- Input của action ----------

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
