// Giới hạn cứng = `@db.VarChar(n)` của `prisma/schema/banners.prisma` (spine AD-14).
export const BANNER_TITLE_MAX = 80;
export const BANNER_DESCRIPTION_MAX = 160;
export const BANNER_LINK_MAX = 500;

// Tỉ lệ ảnh khuyến nghị (FR-32): khung ảnh trên site và khung xem trước của UploadField dùng cùng tỉ lệ.
export const BANNER_IMAGE_RATIO_LABEL = "2:1 (vd 1200 × 600 px)";

export type BannerStatus = "OFF" | "SCHEDULED" | "EXPIRED" | "LIVE";

// Nhãn StatusBadge (UX-DR40, UX-DR79). Chỉ "Đang hiện" lên site.
export const BANNER_STATUS_LABEL: Record<BannerStatus, string> = {
  OFF: "Tắt",
  SCHEDULED: "Chờ lịch",
  EXPIRED: "Hết hạn",
  LIVE: "Đang hiện",
};
