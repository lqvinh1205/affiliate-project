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
  WEB_POST: "Bài web",
  THREADS_POST: "Bài Threads",
  FACEBOOK_POST: "Bài Facebook",
  LINK_COMMENT: "Bình luận kèm link",
} as const satisfies Record<SuggestionKind, string>;

// Các phần của Bộ nội dung (FR-12, AD-19): mỗi phần một gợi ý, khoá đích `contentSetId` + `platform`.
export const CONTENT_SET_KINDS = ["WEB_POST", "THREADS_POST", "FACEBOOK_POST", "LINK_COMMENT"] as const satisfies readonly SuggestionKind[];
export type ContentSetKind = (typeof CONTENT_SET_KINDS)[number];

// Dòng trạng thái của GeneratingIndicator theo phần (UX-DR42, UX-DR96).
export const GENERATING_LABEL = {
  WEB_POST: "Đang viết bài web…",
  THREADS_POST: "Đang viết bài Threads…",
  FACEBOOK_POST: "Đang viết bài Facebook…",
  LINK_COMMENT: "Đang viết bình luận…",
} as const satisfies Record<ContentSetKind, string>;

// Lỗi một phần của Bộ nội dung (UX-DR96, FR-12): phần khác không bị ảnh hưởng.
export const PART_FAILED = {
  WEB_POST: "Chưa tạo được bài web. Phần khác vẫn giữ nguyên. Bấm Tạo lại.",
  THREADS_POST: "Chưa tạo được bài Threads. Phần khác vẫn giữ nguyên. Bấm Tạo lại.",
  FACEBOOK_POST: "Chưa tạo được bài Facebook. Phần khác vẫn giữ nguyên. Bấm Tạo lại.",
  LINK_COMMENT: "Chưa tạo được Bình luận kèm link. Phần khác vẫn giữ nguyên. Bấm Tạo lại.",
} as const satisfies Record<ContentSetKind, string>;

// Chip mẫu của RegenerateDialog (UX-DR57).
export const REGENERATE_CHIPS = ["ngắn hơn", "vui hơn", "bỏ phần giá"] as const;

// Dải thông báo khi AI bỏ qua một năng lực (UX-DR45, FR-6, FR-7).
export const SKIPPED_MESSAGE = {
  images: "AI chưa đọc được ảnh — hồ sơ chỉ dựa trên dữ liệu chữ",
  webSearch: "AI không tìm thêm được nguồn trên web",
  video: "AI chưa đọc được nội dung video",
} as const;

// Cảm hứng không đọc được video (FR-2, UX-DR77): nói rõ hồ sơ dựa trên gì; chỉ gợi ý tải ảnh chụp màn hình khi Cảm hứng
// chưa có ảnh. Không gợi ý tải file video: chưa trích khung hình từ file video (deferred-work), làm theo sẽ quay lại cảnh báo cũ.
export const INSPIRATION_VIDEO_SKIPPED = {
  link: "AI chưa đọc được nội dung video từ link — hồ sơ chỉ dựa trên tiêu đề, chú thích đọc được và ghi chú. Muốn AI có thêm dữ liệu: tải ảnh chụp màn hình video lên (mục Sửa Cảm hứng) rồi Tạo lại.",
  file: "AI chưa đọc được nội dung file video (chưa hỗ trợ trích khung hình) — hồ sơ chỉ dựa trên link và ghi chú. Muốn AI có thêm dữ liệu: thay file video bằng ảnh chụp màn hình (mục Sửa Cảm hứng) rồi Tạo lại.",
  imageRead: "AI chưa đọc được nội dung video — hồ sơ dựa trên ảnh chụp màn hình, tiêu đề, chú thích đọc được và ghi chú.",
  imageNotRead: "AI chưa đọc được nội dung video — hồ sơ chỉ dựa trên tiêu đề, chú thích đọc được và ghi chú.",
} as const;

// Thông báo lỗi tiếng Việt ghi vào `Suggestion.errorMessage` (UX-DR96).
export const RESEARCH_FAILED = "Chưa nghiên cứu được Sản phẩm. Dữ liệu Sản phẩm vẫn giữ nguyên. Bấm Tạo lại.";
export const GENERATING_STALE = "AI chạy quá lâu nên đã dừng. Dữ liệu Sản phẩm vẫn giữ nguyên. Bấm Tạo lại.";
export const INSPIRATION_RESEARCH_FAILED = "Chưa nghiên cứu được Cảm hứng. Dữ liệu Cảm hứng vẫn giữ nguyên. Bấm Tạo lại.";
export const INSPIRATION_GENERATING_STALE = "AI chạy quá lâu nên đã dừng. Dữ liệu Cảm hứng vẫn giữ nguyên. Bấm Tạo lại.";
export const PART_STALE = "AI chạy quá lâu nên đã dừng. Phần khác vẫn giữ nguyên. Bấm Tạo lại.";
export const CATEGORY_NOT_PICKED =
  "AI không chọn được Danh mục có sẵn phù hợp. Chọn Danh mục tay trên form Sản phẩm.";
