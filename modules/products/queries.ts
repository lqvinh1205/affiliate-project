import "server-only";
import type { Prisma } from "@/generated/prisma/client";

// Mọi query public trả Sản phẩm (thẻ Sản phẩm, ảnh đại diện fallback của bài…) dùng hai hằng này,
// không tự viết điều kiện "đang hiện" (spine AD-7, FR-5). Query dùng chúng phải gắn `cacheTag(PRODUCTS_TAG)`.
export const visibleProductWhere = { hidden: false } as const satisfies Prisma.ProductWhereInput;

// Trường Sản phẩm được phép ra website: không có Dữ liệu thô, `hidden`, Danh mục.
export const publicProductSelect = {
  id: true,
  name: true,
  image: true,
  priceText: true,
  priceUpdatedAt: true,
  affiliateUrl: true,
} as const satisfies Prisma.ProductSelect;
