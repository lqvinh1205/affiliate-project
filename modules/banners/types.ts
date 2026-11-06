import type { listBannersForCms } from "@/modules/banners/cms-queries";
import type { getLiveBanners } from "@/modules/banners/queries";

// Banner trên site: chỉ các trường hiển thị (không lịch, không cờ bật).
export type LiveBanner = Awaited<ReturnType<typeof getLiveBanners>>[number];
export type CmsBannerListItem = Awaited<ReturnType<typeof listBannersForCms>>[number];
