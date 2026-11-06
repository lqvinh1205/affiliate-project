// Giới hạn cứng = `@db.VarChar(n)` của `prisma/schema/banners.prisma` (spine AD-14).
export const BANNER_TITLE_MAX = 80;
export const BANNER_DESCRIPTION_MAX = 160;
export const BANNER_LINK_MAX = 500;

// Tỉ lệ ảnh khuyến nghị (FR-32): khung ảnh trên site và khung xem trước của UploadField dùng cùng tỉ lệ.
export const BANNER_IMAGE_RATIO_LABEL = "2:1 (vd 1200 × 600 px)";

// Hồ sơ cache của `getLiveBanners` (AD-7: stale ≥ 30 giây, revalidate > 0 và ≤ 60 giây, expire ≥ 5 phút). Cache
// stale-while-revalidate: lúc có người xem đều, Banner hết lịch rời site trong ~30–60 giây; trang lâu không ai xem thì
// lượt xem đầu có thể còn thấy bản cũ, nhưng không quá `expire` (5 phút) sau lần dựng trước.
export const LIVE_BANNERS_CACHE_LIFE = { stale: 30, revalidate: 30, expire: 300 } as const;

export type BannerStatus = "OFF" | "SCHEDULED" | "EXPIRED" | "LIVE";

// Nhãn StatusBadge (UX-DR40, UX-DR79). Chỉ "Đang hiện" lên site.
export const BANNER_STATUS_LABEL: Record<BannerStatus, string> = {
  OFF: "Tắt",
  SCHEDULED: "Chờ lịch",
  EXPIRED: "Hết hạn",
  LIVE: "Đang hiện",
};
