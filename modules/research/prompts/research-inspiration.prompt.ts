import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";
import { SITE_NAME } from "@/platform/site";
import {
  INSPIRATION_KEYWORD_MAX,
  INSPIRATION_KEYWORDS_MAX,
  INSPIRATION_KEYWORDS_MIN,
  INSPIRATION_OUTLINE_DETAIL_MAX,
  INSPIRATION_OUTLINE_HEADING_MAX,
  INSPIRATION_OUTLINE_MAX,
  INSPIRATION_OUTLINE_MIN,
  INSPIRATION_SUMMARY_MAX,
} from "@/modules/research/constants";

// Nghiên cứu một Cảm hứng (FR-2, UJ-2): từ link video/mẹo, file tải lên và ghi chú của Vinh → từ khoá để tìm Sản phẩm
// trên Shopee + dàn ý bài mẹo. Điều phối ở `modules/suggestions/actions.ts` ghi thành gợi ý `RESEARCH` gắn
// `inspirationId`; Duyệt upsert `ResearchProfile` theo `inspirationId` (AD-19).

export type InspirationResearchInput = {
  url: string | null;
  // Link thuộc host video (TikTok, Pinterest…) — AI cố đọc tiêu đề, chú thích từ trang của link.
  videoLink: boolean;
  note: string | null;
  hasImage: boolean;
  hasVideoFile: boolean;
  // Chỉ dẫn khi Tạo lại (FR-21).
  instruction: string | null;
};

// ---------- Kết quả AI (không transform: sinh JSON Schema cho nhà cung cấp) ----------

const inspirationOutputSchema = z.object({
  summary: z.string().nullable(),
  keywords: z.array(z.string()).min(INSPIRATION_KEYWORDS_MIN),
  outline: z.array(z.object({ heading: z.string(), detail: z.string() })).min(INSPIRATION_OUTLINE_MIN),
});

export type InspirationResearchOutput = z.infer<typeof inspirationOutputSchema>;

export const researchInspirationPrompt: PromptDef<InspirationResearchInput, typeof inspirationOutputSchema> = {
  id: "research.inspiration",
  version: 3,
  profile: "quality",
  output: inspirationOutputSchema,
  system: () => `Bạn giúp người viết trang "${SITE_NAME}" biến một Cảm hứng (video/ảnh mẹo vặt họ lưu lại) thành bài mẹo có gắn sản phẩm bán trên Shopee.
Trả về JSON:
- "summary": 1–3 câu: Cảm hứng nói về mẹo gì, dựa trên những gì bạn thật sự đọc được (tiêu đề, chú thích của trang link, ảnh, ghi chú). Nếu chỉ có ghi chú hoặc không đọc được trang link, nói rõ điều đó; không đoán nội dung video.
- "keywords": ${INSPIRATION_KEYWORDS_MIN}–${INSPIRATION_KEYWORDS_MAX} từ khoá để gõ vào ô tìm kiếm Shopee tìm sản phẩm dùng cho mẹo này; tiếng Việt có dấu như người mua hay gõ, mỗi từ khoá 2–6 chữ, không trùng ý, không kèm giá hay thương hiệu nếu không chắc.
- "outline": ${INSPIRATION_OUTLINE_MIN}–${INSPIRATION_OUTLINE_MAX} mục dàn ý bài mẹo (mở bài, các bước mẹo, lưu ý an toàn, gợi ý sản phẩm hỗ trợ…), mỗi mục có "heading" ngắn và "detail" 1–2 câu nói mục đó viết gì.
Khi có link, dùng công cụ đọc trang để lấy tiêu đề và chú thích của trang đó (nếu đọc được). Không mở link Shopee cần đăng nhập. Bạn không xem được nội dung video.`,
  user: (input) => `Link: ${input.url ?? "(không có)"}${input.url && input.videoLink ? " (link video)" : ""}
Ghi chú của người lưu: ${input.note || "(không có)"}
File tải lên: ${input.hasImage ? "1 ảnh kèm theo — ảnh chụp màn hình hoặc khung hình của Cảm hứng, không phải ảnh sản phẩm" : input.hasVideoFile ? "1 file video (bạn không xem được nội dung video)" : "không có"}
${input.instruction ? `\nChỉ dẫn khi viết lại: ${input.instruction}` : ""}`,
};

// ---------- Payload gợi ý `RESEARCH` của Cảm hứng và `ResearchProfile.data` (AD-19) ----------

const text = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`);
const required = (max: number, message: string) => text(max).min(1, message);
const choiceId = z.string().min(1).max(40);

// Từ khoá và mục dàn ý có `id` ổn định (AD-19). Form sửa nội dung từng ý, không thêm/xoá (muốn đổi thì Tạo lại).
export const inspirationResearchSchema = z.object({
  summary: z
    .string()
    .nullable()
    .transform((s) => s?.trim() || null)
    .pipe(z.string().max(INSPIRATION_SUMMARY_MAX, `Tối đa ${INSPIRATION_SUMMARY_MAX} ký tự`).nullable()),
  keywords: z
    .array(z.object({ id: choiceId, text: required(INSPIRATION_KEYWORD_MAX, "Nhập từ khoá") }))
    .min(INSPIRATION_KEYWORDS_MIN)
    .max(INSPIRATION_KEYWORDS_MAX),
  outline: z
    .array(
      z.object({
        id: choiceId,
        heading: required(INSPIRATION_OUTLINE_HEADING_MAX, "Nhập tiêu đề mục"),
        detail: text(INSPIRATION_OUTLINE_DETAIL_MAX),
      }),
    )
    .min(INSPIRATION_OUTLINE_MIN)
    .max(INSPIRATION_OUTLINE_MAX),
});

export type InspirationResearchData = z.infer<typeof inspirationResearchSchema>;

const clip = (s: string | null | undefined, max: number) => (s ?? "").trim().slice(0, max);

// Kết quả AI → payload: gán `id` ổn định, cắt về giới hạn cứng, bỏ từ khoá trống/trùng (không phân biệt hoa thường).
export function toInspirationResearchPayload(out: InspirationResearchOutput): InspirationResearchData {
  const seen = new Set<string>();
  const keywords = out.keywords
    .map((k) => clip(k, INSPIRATION_KEYWORD_MAX))
    .filter((k) => {
      const key = k.toLocaleLowerCase("vi");
      if (!k || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, INSPIRATION_KEYWORDS_MAX);
  return inspirationResearchSchema.parse({
    summary: clip(out.summary, INSPIRATION_SUMMARY_MAX) || null,
    keywords: keywords.map((text, n) => ({ id: `tu-khoa-${n + 1}`, text })),
    outline: out.outline.slice(0, INSPIRATION_OUTLINE_MAX).map((o, n) => ({
      id: `muc-${n + 1}`,
      heading: clip(o.heading, INSPIRATION_OUTLINE_HEADING_MAX) || `Mục ${n + 1}`,
      detail: clip(o.detail, INSPIRATION_OUTLINE_DETAIL_MAX),
    })),
  });
}
