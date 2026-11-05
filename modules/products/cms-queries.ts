import "server-only";
import { db } from "@/platform/db";
import { PRODUCT_PAGE_SIZE, PRODUCT_PICKER_LIMIT } from "@/modules/products/constants";
import { publicProductSelect, visibleProductWhere } from "@/modules/products/queries";

// Danh sách Kho cho CMS: lọc tên chứa `q` (không phân biệt hoa thường), mới nhất trước.
// `page` từ 1; vượt trang cuối thì kẹp về trang cuối (trả `page` đã kẹp).
export async function listProductsForCms({ q, page }: { q: string; page: number }) {
  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};
  return db.$transaction(async (tx) => {
    const total = await tx.product.count({ where });
    const current = Math.min(Math.max(1, page), Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE)));
    const items = await tx.product.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (current - 1) * PRODUCT_PAGE_SIZE,
      take: PRODUCT_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        priceText: true,
        priceUpdatedAt: true,
        hidden: true,
        category: { select: { name: true } },
      },
    });
    return { items, total, page: current };
  });
}

export async function getProductForCms(id: string) {
  return db.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      affiliateUrl: true,
      image: true,
      priceText: true,
      priceUpdatedAt: true,
      categoryId: true,
      rawText: true,
      rawReviews: true,
      rawImageUrls: true,
      hidden: true,
    },
  });
}

// Kết quả tìm của ProductPicker (gắn Sản phẩm vào bài — UX-DR48): chỉ Sản phẩm đang hiện, tên chứa `q`,
// mới nhất trước; `q` trống thì trả các Sản phẩm mới nhất. Đọc qua URL `?sp=` ở Screen, không có action đọc (AD-12).
export async function searchProductsForPicker(q: string) {
  return db.product.findMany({
    where: { ...visibleProductWhere, ...(q && { name: { contains: q, mode: "insensitive" as const } }) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PRODUCT_PICKER_LIMIT,
    select: { ...publicProductSelect, hidden: true },
  });
}
