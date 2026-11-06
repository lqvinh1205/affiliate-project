import type { Platform } from "@/generated/prisma/enums";

// Nhãn nền tảng (enum `Platform` khai báo ở `prisma/schema/content-sets.prisma` — AD-25).
export const PLATFORM_LABEL = {
  WEBSITE: "Website",
  THREADS: "Threads",
  FACEBOOK: "Facebook",
} as const satisfies Record<Platform, string>;

// Tên phần nội dung của từng nền tảng trên PlatformToggle, thanh nhảy, dòng "Thêm Bài {nền tảng}" (UX-DR51, UX-DR75).
export const PLATFORM_PART_LABEL = {
  WEBSITE: "Bài web",
  THREADS: "Bài Threads",
  FACEBOOK: "Bài Facebook",
} as const satisfies Record<Platform, string>;

export const PLATFORM_KEYS = Object.keys(PLATFORM_LABEL) as Platform[];
// Nền tảng mạng xã hội: có `SocialPost` và Bình luận kèm link (FR-14, FR-15, FR-17).
export const SOCIAL_PLATFORMS = ["THREADS", "FACEBOOK"] as const satisfies readonly Platform[];
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

// Giới hạn cứng nội dung mạng xã hội (AD-25). `LINK_COMMENT_MAX`, `SOCIAL_POST_URL_MAX` = `@db.VarChar(n)` của
// `SocialPost`; `parts` là `String[]` nên giới hạn mỗi phần chỉ ở Zod. Hồ sơ phong cách không đặt mục tiêu vượt
// các số này (test `style-limits.test.ts`).
export const THREADS_POST_MAX = 500; // giới hạn ký tự mỗi bài của Threads (FR-14)
export const THREADS_PARTS_MAX = 10;
export const FACEBOOK_WORDS_MAX = 1000;
export const FACEBOOK_POST_MAX = 8000; // ký tự, chặn khối chữ vô hạn
export const LINK_COMMENT_MAX = 2000;
export const SOCIAL_POST_URL_MAX = 500;

// Lựa chọn Góc viết / Người đọc chép vào `ContentSet` (= `@db.VarChar(n)`; bằng giới hạn của Hồ sơ nghiên cứu).
export const CONTENT_SET_CHOICE_ID_MAX = 40;
export const CONTENT_SET_CHOICE_NAME_MAX = 120;
export const CONTENT_SET_CHOICE_TEXT_MAX = 500;

// Bộ nội dung nhiều Sản phẩm (bài Gom link, FR-12, Flow 6): tối đa 3 món.
export const CONTENT_SET_PRODUCTS_MAX = 3;
// Tham số URL giữ các Sản phẩm thêm vào CreateContentSetPanel (AD-12: client đưa trạng thái lên URL).
export const CONTENT_SET_PRODUCTS_PARAM = "bo";
