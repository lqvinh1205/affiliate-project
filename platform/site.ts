export const SITE_NAME = "Mẹo Cuộc Sống";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Ảnh OpenGraph mặc định của site (AD-26): trang không có ảnh riêng, bài không có ảnh đại diện lẫn ảnh Sản phẩm.
export const DEFAULT_OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: SITE_NAME } as const;

// Khối OpenGraph gốc dùng chung (AD-26). Next gộp metadata nông: trang nào tự đặt `openGraph` thì thay hẳn khối
// của root layout, nên mọi `openGraph` phải trải khối này rồi thêm `url` = canonical.
export const SITE_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: "vi_VN",
  type: "website" as const,
  images: [DEFAULT_OG_IMAGE],
};

// Id vùng nội dung chính: đích của link "Bỏ qua tới nội dung" (UX-DR87).
export const MAIN_CONTENT_ID = "noi-dung";
