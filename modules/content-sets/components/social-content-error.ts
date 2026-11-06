import { firstError } from "@/platform/validation/errors";
import type { SocialPlatform } from "@/modules/content-sets/constants";
import {
  facebookPayloadSchema,
  linkCommentMax,
  linkCommentSchemaFor,
  threadsApprovalSchema,
} from "@/modules/content-sets/schema";

// Cho component ngoài module (bộ đếm Bình luận ở `suggestions/components`) — không import `schema.ts` trực tiếp (AD-2).
export { linkCommentMax };

export type SocialContent =
  | { kind: "THREADS_POST"; posts: string[] }
  | { kind: "FACEBOOK_POST"; body: string }
  | { kind: "LINK_COMMENT"; comment: string };

// Lỗi đầu tiên của nội dung bài mạng xã hội theo đúng schema server kiểm khi Duyệt / Lưu (AD-14) — form dùng làm lý
// do tắt nút "Duyệt" / "Lưu" (UX-DR41). `null` = hợp lệ.
export function socialContentError(content: SocialContent, platform: SocialPlatform): string | null {
  const r =
    content.kind === "THREADS_POST"
      ? threadsApprovalSchema.safeParse({ posts: content.posts })
      : content.kind === "FACEBOOK_POST"
        ? facebookPayloadSchema.safeParse({ body: content.body })
        : linkCommentSchemaFor(platform).safeParse({ comment: content.comment });
  return r.success ? null : firstError(r.error);
}
