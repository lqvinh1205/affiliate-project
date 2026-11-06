import "server-only";
import { db } from "@/platform/db";
import { bannerOrderBy } from "@/modules/banners/queries";
import { bannerStatus } from "@/modules/banners/status";

// Danh sách `/cms/banner`, đúng thứ tự hiển thị trên site; trạng thái tính bằng cùng hàm với site (AD-7).
export async function listBannersForCms() {
  const now = new Date();
  const rows = await db.banner.findMany({
    orderBy: bannerOrderBy,
    select: { id: true, title: true, image: true, enabled: true, startsAt: true, endsAt: true },
  });
  return rows.map((b) => ({ ...b, status: bannerStatus(b, now) }));
}

export async function getBannerForCms(id: string) {
  const banner = await db.banner.findUnique({
    where: { id },
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
  return banner && { ...banner, status: bannerStatus(banner, new Date()) };
}
