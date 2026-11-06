import { z } from "zod";
import { Platform } from "@/generated/prisma/enums";
import {
  CONTENT_SET_CHOICE_ID_MAX,
  CONTENT_SET_CHOICE_TEXT_MAX,
  CONTENT_SET_PRODUCTS_MAX,
  SOCIAL_PLATFORMS,
} from "@/modules/content-sets/constants";
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

// Bấm "Nghiên cứu" ở Chi tiết Cảm hứng hoặc "Tạo lại" kèm chỉ dẫn (FR-2, FR-21).
export const researchInspirationInputSchema = z.object({
  inspirationId: z.string().min(1, "Thiếu Cảm hứng"),
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
export type ResearchInspirationInput = z.input<typeof researchInspirationInputSchema>;
export type ApproveSuggestionInput = z.input<typeof approveSuggestionInputSchema>;
export type RejectSuggestionInput = z.input<typeof rejectSuggestionInputSchema>;

// ---------- Bộ nội dung (Epic 5) ----------

const choiceRef = z.object({ productId: z.string().min(1), id: z.string().min(1).max(CONTENT_SET_CHOICE_ID_MAX) });
const choiceEdit = z
  .string()
  .trim()
  .max(CONTENT_SET_CHOICE_TEXT_MAX, `Tối đa ${CONTENT_SET_CHOICE_TEXT_MAX} ký tự`)
  .optional()
  .transform((s) => s || null);
const platforms = z
  .array(z.enum(Platform))
  .min(1, "Chọn ít nhất một nền tảng")
  .refine((list) => new Set(list).size === list.length, "Nền tảng bị chọn trùng");

// "Tạo bộ nội dung" (FR-12, UX-DR47): Sản phẩm hiện tại đầu tiên + món thêm cho bài Gom link; Góc viết, Người đọc
// chọn theo `id` ổn định của hồ sơ (AD-19) kèm bản sửa tuỳ chọn; ≥ 1 nền tảng.
export const createContentSetInputSchema = z.object({
  productIds: z
    .array(z.string().min(1))
    .min(1, "Thiếu Sản phẩm")
    .max(CONTENT_SET_PRODUCTS_MAX, `Tối đa ${CONTENT_SET_PRODUCTS_MAX} Sản phẩm mỗi bộ`)
    .refine((ids) => new Set(ids).size === ids.length, "Sản phẩm bị thêm trùng"),
  angle: choiceRef.nullable().refine((v) => v !== null, "Chọn một Góc viết"),
  angleEdit: choiceEdit,
  audience: choiceRef.nullable().refine((v) => v !== null, "Chọn một Người đọc"),
  audienceEdit: choiceEdit,
  platforms,
  // Mở từ Cảm hứng (`?cam-hung=<id>`, FR-2): bộ ghi liên kết, Cảm hứng thành *Đã dùng*.
  inspirationId: z.string().min(1).nullish(),
});

// "Thêm Bài {nền tảng}" vào bộ đang có (UX-DR75).
export const addContentSetPlatformInputSchema = z.object({
  contentSetId: z.string().min(1, "Thiếu Bộ nội dung"),
  platform: z.enum(Platform),
});

// "Tạo bài mạng xã hội" từ Bài web có sẵn (FR-16, UX-DR55): chỉ Threads / Facebook.
export const createSocialFromPostInputSchema = z.object({
  postId: z.string().min(1, "Thiếu Bài web"),
  platforms: z
    .array(z.enum(SOCIAL_PLATFORMS))
    .min(1, "Chọn ít nhất một nền tảng")
    .refine((list) => new Set(list).size === list.length, "Nền tảng bị chọn trùng"),
});

// Tạo lại một phần của Bộ nội dung kèm chỉ dẫn (FR-21, Story 5.7) — kể cả phần đã Duyệt.
export const regenerateSuggestionInputSchema = z.object({
  id: suggestionId,
  instruction: z
    .string()
    .trim()
    .max(SUGGESTION_INSTRUCTION_MAX, `Chỉ dẫn tối đa ${SUGGESTION_INSTRUCTION_MAX} ký tự`)
    .optional()
    .transform((s) => s || null),
});

// Sao chép gợi ý chưa Duyệt (AD-21): ghi `Suggestion.firstCopiedAt` lần đầu.
export const recordSuggestionCopyInputSchema = z.object({ id: suggestionId });

// Cột Json `riskWarnings` (FR-23): câu trích + lý do.
export const riskWarningsSchema = z.array(z.object({ sentence: z.string(), reason: z.string() }));

export type CreateContentSetInput = z.input<typeof createContentSetInputSchema>;
export type AddContentSetPlatformInput = z.input<typeof addContentSetPlatformInputSchema>;
export type CreateSocialFromPostInput = z.input<typeof createSocialFromPostInputSchema>;
export type RegenerateSuggestionInput = z.input<typeof regenerateSuggestionInputSchema>;
export type RecordSuggestionCopyInput = z.input<typeof recordSuggestionCopyInputSchema>;
