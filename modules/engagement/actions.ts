"use server";

import { headers } from "next/headers";
import type { z } from "zod";
import { isBotUserAgent } from "@/platform/bot";
import { UNEXPECTED_ERROR, type Result } from "@/platform/errors";
import { clientKey, createRateLimiter } from "@/platform/rate-limit";
import { INVALID_INPUT_ERROR, RATE_LIMITED_ERROR, VIEW_RATE_LIMIT } from "@/modules/engagement/constants";
import { recordPostViewInputSchema } from "@/modules/engagement/schema";
import { recordPostViewRecord } from "@/modules/engagement/service";

// Action công khai — ngoại lệ số 1 của AD-6 ([QD-20]): không `run()`/`requireAdmin()`; validate; giới hạn tần suất
// theo băm IP trong bộ nhớ (AD-23); không `updateTag` (Lượt xem không đổi nội dung trang tĩnh); không lưu hay ghi
// log định danh người đọc (NFR-7, [QD-18]) — vì vậy không `console.error`.

const viewLimiter = createRateLimiter(VIEW_RATE_LIMIT);

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
