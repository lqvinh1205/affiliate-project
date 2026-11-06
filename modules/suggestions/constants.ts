import type { SuggestionKind, SuggestionStatus } from "@/generated/prisma/enums";

// Vòng đời một lần gọi AI (spine AD-18): `GENERATING` quá 120 giây coi là `FAILED` (tiến trình khởi động lại làm mất
// `after()`); màn hình hỏi lại mỗi 3 giây.
export const GENERATING_TIMEOUT_MS = 120_000;
export const POLL_INTERVAL_MS = 3_000;

// Giới hạn cứng = `@db.VarChar(n)` của `prisma/schema/suggestions.prisma` (AD-14).
export const SUGGESTION_ERROR_MAX = 300;
export const SUGGESTION_PROMPT_ID_MAX = 100;
// Chỉ dẫn ngắn khi Tạo lại (FR-21).
export const SUGGESTION_INSTRUCTION_MAX = 200;

// `SUPERSEDED` không hiện trên giao diện (UX-DR40).
export type VisibleSuggestionStatus = Exclude<SuggestionStatus, "SUPERSEDED">;

export const SUGGESTION_STATUS_LABEL = {
  GENERATING: "Đang tạo",
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  FAILED: "Lỗi",
} as const satisfies Record<VisibleSuggestionStatus, string>;

// Tên phần ở đầu SuggestionCard (UX-DR41).
export const SUGGESTION_KIND_LABEL = {
  RESEARCH: "Hồ sơ nghiên cứu",
  PRODUCT_CATEGORY: "Danh mục gợi ý",
} as const satisfies Record<SuggestionKind, string>;

// Chip mẫu của RegenerateDialog (UX-DR57).
export const REGENERATE_CHIPS = ["ngắn hơn", "vui hơn", "bỏ phần giá"] as const;

// Dải thông báo khi AI bỏ qua một năng lực (UX-DR45, FR-6, FR-7).
export const SKIPPED_MESSAGE = {
  images: "AI chưa đọc được ảnh — hồ sơ chỉ dựa trên dữ liệu chữ",
  webSearch: "AI không tìm thêm được nguồn trên web",
  video: "AI chưa đọc được nội dung video",
} as const;

// Thông báo lỗi tiếng Việt ghi vào `Suggestion.errorMessage` (UX-DR96).
export const RESEARCH_FAILED = "Chưa nghiên cứu được Sản phẩm. Dữ liệu Sản phẩm vẫn giữ nguyên. Bấm Tạo lại.";
export const GENERATING_STALE = "AI chạy quá lâu nên đã dừng. Dữ liệu Sản phẩm vẫn giữ nguyên. Bấm Tạo lại.";
export const CATEGORY_NOT_PICKED =
  "AI không chọn được Danh mục có sẵn phù hợp. Chọn Danh mục tay trên form Sản phẩm.";
