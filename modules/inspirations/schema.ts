import { z } from "zod";
import { uploadedMediaKind } from "@/platform/upload-rules";
import { INSPIRATION_NOTE_MAX, INSPIRATION_URL_MAX } from "@/modules/inspirations/constants";

const isHttpUrl = (s: string) => {
  try {
    return /^https?:$/.test(new URL(s).protocol);
  } catch {
    return false;
  }
};

// Ô link nhận cả đoạn chữ chia sẻ của app ("Xem video này… https://vt.tiktok.com/abc/"): giữ link http(s) đầu tiên
// để dán một lần là lưu được (FR-1, UX-DR76). Chỉ giữ nguyên khi cả ô là một link không khoảng trắng — `new URL()`
// nhận cả "https://a/b Xem video" (mã hoá khoảng trắng) nên không dùng nó để nhận ra link trơn.
export function extractLink(text: string) {
  const s = text.trim();
  if (!s || (!/\s/.test(s) && isHttpUrl(s))) return s;
  const found = s.match(/https?:\/\/[^\s<>"']+/i)?.[0] ?? s;
  return found.replace(/[).,;!?…]+$/, "");
}

const link = z
  .string()
  .transform(extractLink)
  .pipe(
    z
      .string()
      .max(INSPIRATION_URL_MAX, `Link tối đa ${INSPIRATION_URL_MAX} ký tự`)
      .refine((s) => !s || isHttpUrl(s), "Link phải bắt đầu bằng http:// hoặc https://"),
  )
  .transform((s) => s || null);

// File chỉ nhận đường dẫn do route upload trả (AD-24), không nhận link ngoài.
const media = z
  .string()
  .trim()
  .refine((s) => !s || uploadedMediaKind(s) !== null, "File phải tải lên bằng nút Chọn ảnh hoặc video")
  .transform((s) => s || null);

const note = z
  .string()
  .trim()
  .max(INSPIRATION_NOTE_MAX, `Ghi chú tối đa ${INSPIRATION_NOTE_MAX} ký tự`)
  .transform((s) => s || null);

// Lưu Cảm hứng (FR-1): chỉ cần một link **hoặc** một file; ghi chú tuỳ chọn. Có `id` là sửa (thêm file video sau…).
export const inspirationInputSchema = z
  .object({ id: z.string().min(1).optional(), url: link, mediaUrl: media, note })
  .refine((v) => v.url || v.mediaUrl, { message: "Dán một link hoặc tải lên một file", path: ["url"] });

// "Bỏ qua" / "Đưa lại vào Mới" (UX-DR61): chỉ hai trạng thái lưu; *Đã dùng* suy ra, không đặt tay.
export const setInspirationStatusInputSchema = z.object({
  id: z.string().min(1, "Thiếu Cảm hứng"),
  status: z.enum(["NEW", "SKIPPED"]),
});

export type InspirationFormValues = z.input<typeof inspirationInputSchema>;
export type InspirationInput = z.output<typeof inspirationInputSchema>;
export type SetInspirationStatusInput = z.input<typeof setInspirationStatusInputSchema>;
