import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { bannerStatus } from "@/modules/banners/status";
import { bannerLinkKind } from "@/modules/banners/link";
import { LIVE_BANNERS_CACHE_LIFE } from "@/modules/banners/constants";
import { BANNERS_TAG } from "@/modules/banners/tags";

// Thứ tự hiển thị: `sortOrder` tăng dần, trùng thì Banner tạo trước đứng trước. Dùng chung cho CMS, site và service.
export const bannerOrderBy = [
  { sortOrder: "asc" },
  { createdAt: "asc" },
  { id: "asc" },
] satisfies Prisma.BannerOrderByWithRelationInput[];

// Banner đang hiện trên Trang chủ (FR-32, spine AD-7): đang bật và đang trong lịch theo `bannerStatus`, đúng thứ tự.
// Thời điểm hiện tại lấy **bên trong** hàm cache (không nhận `now` làm tham số — tham số là khoá cache);
// `LIVE_BANNERS_CACHE_LIFE` (revalidate 30 giây, expire 5 phút) để Banner tới lịch / hết hạn tự đổi trên site không cần
// deploy lại; sửa trong CMS thì `updateTag(banners)` đổi ngay. Bảng Banner ít dòng: lọc lịch bằng hàm chung thay vì
// viết lại điều kiện trong `where`. Dòng có link đích không hợp lệ (ghi thẳng vào DB, luật cũ) bị bỏ, để thẻ không bao
// giờ thành link ra ngoài sai FR-25.
export async function getLiveBanners() {
  "use cache";
  cacheLife(LIVE_BANNERS_CACHE_LIFE);
  cacheTag(BANNERS_TAG);
  const now = new Date();
  const rows = await db.banner.findMany({
    where: { enabled: true },
    orderBy: bannerOrderBy,
    select: {
      id: true,
      title: true,
      description: true,
      image: true,
      linkUrl: true,
      enabled: true,
      startsAt: true,
      endsAt: true,
    },
  });
  return rows
    .filter((b) => bannerStatus(b, now) === "LIVE" && bannerLinkKind(b.linkUrl) !== null)
    .map(({ id, title, description, image, linkUrl }) => ({ id, title, description, image, linkUrl }));
}
