// Giới hạn cứng = `@db.VarChar(n)` của `prisma/schema/bio.prisma` (spine AD-14).
export const BIO_INTRO_MAX = 500;
export const BIO_DISCLOSURE_MAX = 300;

// Giá trị khởi tạo khi Vinh chưa lưu `/cms/bio` lần nào (FR-31). Câu công khai không dùng "đã test", "tự mua"
// (EXPERIENCE.md › Voice and Tone).
export const BIO_SETTINGS_DEFAULTS = {
  intro: "Mình là Vinh. Đây là những món đồ nhà bếp, dọn dẹp, ở trọ mình thấy đáng mua, gom lại cho bạn dễ tìm.",
  disclosure:
    "Trang có link tiếp thị liên kết Shopee. Bạn mua qua link, mình nhận một khoản hoa hồng nhỏ để duy trì trang web, giá bạn trả hoàn toàn không đổi.",
} as const;

// Số món tối đa của dải "Gom link đồ xinh" trên Trang chủ (UX-DR62).
export const BIO_HIGHLIGHTS_LIMIT = 8;

// Tên nhóm cho Sản phẩm chưa có Danh mục trên chip "Tất cả" của `/bio`.
export const BIO_UNCATEGORIZED_LABEL = "Khác";

// Dòng AffiliateDisclosure ngắn dưới tiêu đề dải "Gom link đồ xinh" Trang chủ (EXPERIENCE.md › AffiliateDisclosure).
export const BIO_HIGHLIGHTS_DISCLOSURE = "Link Shopee là link tiếp thị liên kết, mình nhận hoa hồng nhỏ, giá bạn trả không đổi.";
