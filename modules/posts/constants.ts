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
// Khối thả tim + chia sẻ cuối bài.
export const ARTICLE_ACTIONS_TITLE_ID = "tuong-tac";

// Id đã dùng trên trang bài: h2 thân bài không được trùng (`withHeadingIds`).
export const ARTICLE_RESERVED_IDS = [
  PRODUCTS_SECTION_ID,
  PRODUCTS_TITLE_ID,
  RELATED_POSTS_TITLE_ID,
  ARTICLE_ACTIONS_TITLE_ID,
  MAIN_CONTENT_ID,
];

// Giới hạn cứng khi AI viết Bài web (AD-25): Hồ sơ phong cách Website không đặt mục tiêu vượt các số này
// (`modules/style-profiles/constants.ts` chép lại — test `modules/content-sets/style-limits.test.ts`).
export const WEB_POST_WORDS_MAX = 3000;
export const WEB_POST_SECTIONS_MAX = 10;

// Nhập Bài web từ URL (FR-39, `importPostFromUrl`) và AI chỉnh sửa (FR-40, `rewritePostDraft`).
export const POST_IMPORT_URL_MAX = 2000;
// Số link ảnh của bài gốc trả về khối "Ảnh trong bài gốc".
export const POST_IMPORT_IMAGES_MAX = 20;
export const POST_REWRITE_INSTRUCTION_MAX = 200;

// Tìm kiếm `/tim-kiem` (FR-36, action công khai `searchPosts` — spine AD-6 ngoại lệ số 2).
// Từ khoá: tối thiểu 2 ký tự (1 ký tự chưa tìm — UX-DR31), tối đa 100 ký tự và 8 từ (đủ cho câu hỏi tự nhiên, chặn
// chuỗi dài làm truy vấn nặng).
export const SEARCH_QUERY_MIN = 2;
export const SEARCH_QUERY_MAX = 100;
export const SEARCH_TERMS_MAX = 8;
// Số kết quả trả về một lần (dòng "Tìm thấy N bài viết" vẫn đếm đủ N).
export const SEARCH_RESULTS_LIMIT = 20;
// Giới hạn tần suất: 60 lần tìm/phút mỗi nguồn (băm IP). Người đọc gõ có chờ 300 ms nên một lần tìm thật tốn vài
// lượt; mức này chừa chỗ cho nhiều người chung IP mà vẫn chặn script dội.
export const SEARCH_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

// Lỗi của Nhập từ URL / AI chỉnh sửa (UserError tiếng Việt — AD-13).
export const IMPORT_UNREADABLE = "Không đọc được nội dung trang này. Thử copy nội dung rồi dán vào trình soạn.";
export const IMPORT_NO_WEB = "Nhà AI hiện tại không đọc được trang web.";
export const REWRITE_EMPTY = "Thân bài đang trống — viết hoặc nhập nội dung trước.";
