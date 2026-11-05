import "server-only";
import { db } from "@/platform/db";
import { PRODUCT_PAGE_SIZE } from "@/modules/products/constants";

// Danh sách Kho cho CMS: lọc tên chứa `q` (không phân biệt hoa thường), mới nhất trước, `page` từ 1.
export async function listProductsForCms({ q, page }: { q: string; page: number }) {
  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};
  const [items, total] = await db.$transaction([
    db.product.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PRODUCT_PAGE_SIZE,
      take: PRODUCT_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        priceText: true,
        priceUpdatedAt: true,
        category: { select: { name: true } },
      },
    }),
    db.product.count({ where }),
  ]);
  return { items, total };
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
    },
  });
}
