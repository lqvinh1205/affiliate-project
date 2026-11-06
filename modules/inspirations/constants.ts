// Giới hạn cứng = `@db.VarChar(n)` của `prisma/schema/inspirations.prisma` (spine AD-14).
export const INSPIRATION_URL_MAX = 2000;
export const INSPIRATION_MEDIA_URL_MAX = 200;
export const INSPIRATION_NOTE_MAX = 500;

// Số Cảm hứng mỗi trang ở `/cms/cam-hung` (`?trang=n`).
export const INSPIRATION_PAGE_SIZE = 20;

// Tham số URL (AD-12): bộ lọc danh sách, và Cảm hứng đang đi theo khi mở màn Sản phẩm (UX-DR61, UX-DR47).
export const INSPIRATION_FILTER_PARAM = "trang-thai";
export const INSPIRATION_PARAM = "cam-hung";

// Trạng thái hiển thị (StatusBadge, bộ lọc): *Mới* / *Bỏ qua* lưu ở `Inspiration.status`; *Đã dùng* suy ra từ
// `ContentSet.inspirationId` và thắng trạng thái lưu (spine: không lưu cột).
export type InspirationDisplayStatus = "NEW" | "USED" | "SKIPPED";

export const INSPIRATION_STATUS_LABEL: Record<InspirationDisplayStatus, string> = {
  NEW: "Mới",
  USED: "Đã dùng",
  SKIPPED: "Bỏ qua",
};

// Giá trị `?trang-thai=` của bộ lọc (UX-DR76); vắng hoặc lạ → *Mới*.
export const INSPIRATION_FILTERS = [
  { value: "moi", status: "NEW" },
  { value: "da-dung", status: "USED" },
  { value: "bo-qua", status: "SKIPPED" },
] as const satisfies readonly { value: string; status: InspirationDisplayStatus }[];

// `?trang-thai=`: giá trị lạ hoặc thiếu → *Mới* (mặc định của danh sách).
export function inspirationFilterOf(value: string): (typeof INSPIRATION_FILTERS)[number] {
  return INSPIRATION_FILTERS.find((f) => f.value === value) ?? INSPIRATION_FILTERS[0];
}

// Host link video (FR-2): link thuộc các host này được gửi cho AI như link video (`ask({ videoUrl })`); nhà AI chưa
// đọc được video thì `skipped` có `video` và màn Cảm hứng báo rõ (AD-10).
export const VIDEO_LINK_HOSTS = [
  "tiktok.com",
  "pinterest.com",
  "pin.it",
  "youtube.com",
  "youtu.be",
  "facebook.com",
  "fb.watch",
  "instagram.com",
  "threads.net",
];
