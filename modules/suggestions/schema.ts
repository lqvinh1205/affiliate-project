import { z } from "zod";
import { SUGGESTION_INSTRUCTION_MAX } from "@/modules/suggestions/constants";

const suggestionId = z.string().min(1, "Thiếu gợi ý");

// Bấm "Nghiên cứu" lần đầu hoặc "Tạo lại" hồ sơ kèm chỉ dẫn ngắn tuỳ chọn (FR-21).
export const researchProductInputSchema = z.object({
  productId: z.string().min(1, "Thiếu Sản phẩm"),
  instruction: z
    .string()
    .trim()
    .max(SUGGESTION_INSTRUCTION_MAX, `Chỉ dẫn tối đa ${SUGGESTION_INSTRUCTION_MAX} ký tự`)
    .optional()
    .transform((s) => s || null),
});

// Duyệt: `payload` là nội dung đã sửa (theo Zod của `kind`, parse ở action); bỏ trống = Duyệt nguyên bản AI.
export const approveSuggestionInputSchema = z.object({ id: suggestionId, payload: z.unknown().optional() });

export const rejectSuggestionInputSchema = z.object({ id: suggestionId });

// Cột Json `sources`, `skipped` (spine AD-9) — kết quả `ask()`.
export const suggestionSourcesSchema = z.array(z.object({ url: z.string(), title: z.string() }));
export const suggestionSkippedSchema = z.array(z.enum(["images", "webSearch", "video"]));

export type ResearchProductInput = z.input<typeof researchProductInputSchema>;
export type ApproveSuggestionInput = z.input<typeof approveSuggestionInputSchema>;
export type RejectSuggestionInput = z.input<typeof rejectSuggestionInputSchema>;
