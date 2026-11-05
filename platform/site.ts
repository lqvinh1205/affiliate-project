export const SITE_NAME = "Mẹo Vặt Cuộc Sống";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Ảnh OpenGraph mặc định của site (AD-26): trang không có ảnh riêng, bài không có ảnh đại diện lẫn ảnh Sản phẩm.
export const DEFAULT_OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: SITE_NAME } as const;

// Id vùng nội dung chính: đích của link "Bỏ qua tới nội dung" (UX-DR87).
export const MAIN_CONTENT_ID = "noi-dung";
