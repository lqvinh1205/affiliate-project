import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { CATEGORIES_TAG } from "@/modules/categories/tags";
import { publicProductSelect, visibleProductWhere } from "@/modules/products/queries";
import { PRODUCTS_TAG } from "@/modules/products/tags";
import type { PublicProduct } from "@/modules/products/types";
import { BIO_SETTINGS_DEFAULTS } from "@/modules/bio/constants";
import { flattenBioEntries } from "@/modules/bio/order";
import { BIO_TAG } from "@/modules/bio/tags";

// Query public của Trang bio (spine AD-7): `bio` là tầng cao nhất chạm bảng nên query đặt ở đây (AD-2); Sản phẩm
// chỉ qua `visibleProductWhere` + `publicProductSelect`; gắn tag mọi module có bảng được đọc.

const bioProductSelect = {
  ...publicProductSelect,
  createdAt: true,
  categoryId: true,
  bioItem: { select: { visible: true, pinned: true, sortAt: true, pinnedAt: true } },
} as const satisfies Prisma.ProductSelect;

// Sản phẩm đang hiện trên website và trên bio (thiếu `BioItem` = hiện), theo thứ tự bio (`order.ts`).
async function visibleBioProducts(): Promise<(PublicProduct & { categoryId: string | null; pinned: boolean })[]> {
  const rows = await db.product.findMany({
    where: { ...visibleProductWhere, NOT: { bioItem: { is: { visible: false } } } },
    select: bioProductSelect,
  });
  return flattenBioEntries(rows).map((r) => ({
    id: r.id,
    name: r.name,
    image: r.image,
    priceText: r.priceText,
    priceUpdatedAt: r.priceUpdatedAt,
    affiliateUrl: r.affiliateUrl,
    categoryId: r.categoryId,
    pinned: r.bioItem?.pinned ?? false,
  }));
}

// Trang `/bio` (FR-30, UX-DR66): giới thiệu, câu công khai, ảnh đại diện (thiếu bản ghi = giá trị khởi tạo), món theo
// thứ tự bio và Danh mục có món theo thứ tự hiển thị (dòng Danh mục, nhóm).
export async function getBioPage() {
  "use cache";
  cacheLife("days");
  cacheTag(BIO_TAG, PRODUCTS_TAG, CATEGORIES_TAG);
  const [settings, items] = await Promise.all([
    db.bioSettings.findFirst({ orderBy: { createdAt: "asc" }, select: { intro: true, disclosure: true, avatar: true } }),
    visibleBioProducts(),
  ]);
  const used = [...new Set(items.flatMap((p) => (p.categoryId ? [p.categoryId] : [])))];
  const categories = await db.category.findMany({
    where: { id: { in: used } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true, name: true, slug: true, description: true },
  });
  return { ...(settings ?? BIO_SETTINGS_DEFAULTS), items, categories };
}

// Dải "Gom link đồ xinh" Trang chủ (UX-DR62): `limit` món đầu theo thứ tự bio.
export async function getBioHighlights(limit: number): Promise<PublicProduct[]> {
  "use cache";
  cacheLife("days");
  cacheTag(BIO_TAG, PRODUCTS_TAG);
  const items = await visibleBioProducts();
  return items
    .slice(0, limit)
    .map(({ id, name, image, priceText, priceUpdatedAt, affiliateUrl }) => ({ id, name, image, priceText, priceUpdatedAt, affiliateUrl }));
}
