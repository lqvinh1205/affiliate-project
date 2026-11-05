import type { PostType, Status } from "@/generated/prisma/enums";
import { MAIN_CONTENT_ID } from "@/platform/site";

// Loại bài (enum `PostType`): nhãn, đường dẫn trang Loại bài (`/meo-vat`, `/gom-link`) và mô tả.
// Khoá lấy từ enum Prisma; thêm Loại bài thì enum và bảng này đổi cùng nhau ([KT-08]).
export const POST_TYPES = {
  MEO_VAT: {
    label: "Mẹo vặt",
    slug: "meo-vat",
    description: "Mẹo nhà cửa, bếp núc, giặt giũ và chăm sóc bản thân.",
  },
  GOM_LINK: {
    label: "Gom link",
    slug: "gom-link",
    description: "Tổng hợp đồ xinh, đồ tiện ích giá tốt đã được chọn lọc.",
  },
} as const satisfies Record<PostType, { label: string; slug: string; description: string }>;

export const POST_TYPE_KEYS = Object.keys(POST_TYPES) as PostType[];

// Nhãn trạng thái Bài web trong CMS.
export const POST_STATUS_LABEL = { DRAFT: "Nháp", PUBLISHED: "Đã xuất bản" } as const satisfies Record<Status, string>;

// Số Bài web mỗi trang ở trang Danh mục và Loại bài (`/…/trang/[n]`, spine AD-7).
export const PAGE_SIZE = 12;

// Giới hạn cứng của Bài web (spine AD-14, AD-25). `excerpt` = `@db.VarChar(500)` của `prisma/schema/posts.prisma`;
// các cột còn lại là `String`/`Text` nên giới hạn chỉ ở Zod, để form không gửi khối chữ vô hạn.
export const POST_TITLE_MAX = 200;
export const POST_SLUG_MAX = 200;
export const POST_EXCERPT_MAX = 500;
export const POST_SEO_TITLE_MAX = 200;
export const POST_SEO_DESCRIPTION_MAX = 500;
export const POST_CONTENT_MAX = 200_000;
export const POST_TAGS_MAX = 20;
export const POST_TAG_MAX = 60;
export const POST_PRODUCTS_MAX = 30;

// Mục tiêu mềm hiện ở bộ đếm trong form (không chặn lưu).
export const POST_TITLE_TARGET = 70;
export const POST_SEO_TITLE_TARGET = 60;
export const POST_SEO_DESCRIPTION_TARGET = { min: 140, max: 160 } as const;

// Lọc trạng thái ở `/cms/bai-viet?trang-thai=…` (giá trị trên URL tiếng Việt, không dấu).
export const POST_STATUS_FILTERS = { nhap: "DRAFT", "da-xuat-ban": "PUBLISHED" } as const satisfies Record<string, Status>;
export type PostStatusFilter = keyof typeof POST_STATUS_FILTERS;

// Số Bài web mỗi trang ở `/cms/bai-viet` (`?trang=n`).
export const CMS_POST_PAGE_SIZE = 20;

// Số bài liên quan cuối trang bài (UX-DR17).
export const RELATED_POSTS_LIMIT = 3;

// Id khối Sản phẩm trên trang bài: nút "Sản phẩm" của ArticleActionBar cuộn tới đây.
export const PRODUCTS_SECTION_ID = "san-pham";
export const PRODUCTS_TITLE_ID = "san-pham-title";
export const RELATED_POSTS_TITLE_ID = "bai-lien-quan";

// Id đã dùng trên trang bài: h2 thân bài không được trùng (`withHeadingIds`).
export const ARTICLE_RESERVED_IDS = [PRODUCTS_SECTION_ID, PRODUCTS_TITLE_ID, RELATED_POSTS_TITLE_ID, MAIN_CONTENT_ID];
