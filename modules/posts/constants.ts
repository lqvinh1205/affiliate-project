import type { PostType, Status } from "@/generated/prisma/enums";

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
