import type { BannerStatus } from "@/modules/banners/constants";

type Schedule = { enabled: boolean; startsAt: Date | null; endsAt: Date | null };

// Hàm duy nhất tính trạng thái lịch của Banner, dùng cho cả query public và CMS (spine AD-7). So thời điểm tuyệt đối
// nên không phụ thuộc múi giờ; giờ Việt Nam chỉ là cách nhập/hiển thị. Khung lịch là [startsAt, endsAt): tới đúng
// `endsAt` là hết hạn. Tắt luôn thắng lịch.
export function bannerStatus({ enabled, startsAt, endsAt }: Schedule, now: Date): BannerStatus {
  if (!enabled) return "OFF";
  if (endsAt && now >= endsAt) return "EXPIRED";
  if (startsAt && now < startsAt) return "SCHEDULED";
  return "LIVE";
}
