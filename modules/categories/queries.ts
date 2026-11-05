import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/platform/db";
import { CATEGORIES_TAG } from "@/modules/categories/tags";

// Danh mục theo đường dẫn hiện tại, cho trang `/[danh-muc]` (tra trước `<Suspense>` — AD-12).
export async function getPublicCategory(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(CATEGORIES_TAG);
  return db.category.findUnique({ where: { slug }, select: { id: true, name: true, slug: true, description: true } });
}

// Đường dẫn hiện tại của Danh mục từng dùng `oldSlug` (AD-20); null nếu không có lịch sử.
export async function getCategorySlugRedirect(oldSlug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(CATEGORIES_TAG);
  const row = await db.categorySlugRedirect.findUnique({
    where: { oldSlug },
    select: { category: { select: { slug: true } } },
  });
  return row?.category.slug ?? null;
}
