"use server";

import { headers } from "next/headers";
import type { z } from "zod";
import { isBotUserAgent } from "@/platform/bot";
import { INVALID_INPUT_ERROR, RATE_LIMITED_ERROR, UNEXPECTED_ERROR, type Result } from "@/platform/errors";
import { clientKey, createRateLimiter } from "@/platform/rate-limit";
import {
  LIKE_COUNT_RATE_LIMIT,
  LIKE_RATE_LIMIT,
  POST_GONE_ERROR,
  VIEW_RATE_LIMIT,
} from "@/modules/engagement/constants";
import { getPostLikesInputSchema, recordPostViewInputSchema, setPostLikeInputSchema } from "@/modules/engagement/schema";
import { getPostLikesRecord, recordPostViewRecord, setPostLikeRecord } from "@/modules/engagement/service";

// Action công khai — ngoại lệ số 1 của AD-6 ([QD-20]): ghi Lượt xem, Lượt tim và đọc số Lượt tim một bài. Không
// `run()`/`requireAdmin()`; validate; giới hạn tần suất theo băm IP trong bộ nhớ (AD-23); không `updateTag` (số đếm
// không đổi nội dung trang tĩnh); không lưu hay ghi log định danh người đọc (NFR-7, [QD-18]) — vì vậy không
// `console.error`.

const viewLimiter = createRateLimiter(VIEW_RATE_LIMIT);
const likeLimiter = createRateLimiter(LIKE_RATE_LIMIT);
const likeCountLimiter = createRateLimiter(LIKE_COUNT_RATE_LIMIT);

// Ghi một Lượt xem cho Bài web đã xuất bản. `counted: false` khi bỏ qua (bot, bài không có/chưa xuất bản) — client
// vẫn đánh dấu đã gửi; bị giới hạn tần suất → `ok: false`, client không đánh dấu để lần mở sau gửi lại.
export async function recordPostView(
  input: z.input<typeof recordPostViewInputSchema>,
): Promise<Result<{ counted: boolean }>> {
  const parsed = recordPostViewInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_INPUT_ERROR };
  try {
    const h = await headers();
    if (isBotUserAgent(h.get("user-agent"))) return { ok: true, counted: false };
    if (!viewLimiter.hit(clientKey(h))) return { ok: false, error: RATE_LIMITED_ERROR };
    return { ok: true, counted: await recordPostViewRecord(parsed.data.postId) };
  } catch {
    return { ok: false, error: UNEXPECTED_ERROR };
  }
}

// Đọc số Lượt tim của một bài để trang tĩnh hiện trong LikeButton (FR-35; AD-6 ngoại lệ số 1 — chỉ đọc).
export async function getPostLikes(
  input: z.input<typeof getPostLikesInputSchema>,
): Promise<Result<{ likes: number }>> {
  const parsed = getPostLikesInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_INPUT_ERROR };
  try {
    if (!likeCountLimiter.hit(clientKey(await headers()))) return { ok: false, error: RATE_LIMITED_ERROR };
    return { ok: true, likes: await getPostLikesRecord(parsed.data.postId) };
  } catch {
    return { ok: false, error: UNEXPECTED_ERROR };
  }
}

// Thả / bỏ tim một bài (FR-35): trả số Lượt tim mới. Mỗi trình duyệt một tim mỗi bài do client giữ (`localStorage`,
// AD-23); server chỉ cộng / trừ, không biết ai thả. Bị giới hạn tần suất / bài không còn / lỗi → `ok: false`, client
// hoàn trạng thái.
export async function setPostLike(
  input: z.input<typeof setPostLikeInputSchema>,
): Promise<Result<{ likes: number }>> {
  const parsed = setPostLikeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_INPUT_ERROR };
  try {
    if (!likeLimiter.hit(clientKey(await headers()))) return { ok: false, error: RATE_LIMITED_ERROR };
    const likes = await setPostLikeRecord(parsed.data.postId, parsed.data.liked);
    return likes === null ? { ok: false, error: POST_GONE_ERROR } : { ok: true, likes };
  } catch {
    return { ok: false, error: UNEXPECTED_ERROR };
  }
}
