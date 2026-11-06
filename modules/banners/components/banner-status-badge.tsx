import { BANNER_STATUS_LABEL, type BannerStatus } from "@/modules/banners/constants";
import { Badge } from "@/components/ui/badge";

// StatusBadge của Banner (UX-DR40, UX-DR79): Tắt, Hết hạn trung tính; Chờ lịch nhóm chờ xử lý; Đang hiện nhóm đang chạy.
const STATUS_CLASS: Record<BannerStatus, string> = {
  OFF: "bg-surface-container-high text-on-surface-variant",
  EXPIRED: "bg-surface-container-high text-on-surface-variant",
  SCHEDULED: "bg-tertiary-fixed text-on-tertiary-fixed",
  LIVE: "bg-secondary-container text-on-secondary-container",
};

export function BannerStatusBadge({ status }: { status: BannerStatus }) {
  return <Badge className={STATUS_CLASS[status]}>{BANNER_STATUS_LABEL[status]}</Badge>;
}
