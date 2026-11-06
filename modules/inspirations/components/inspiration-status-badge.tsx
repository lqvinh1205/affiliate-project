import { INSPIRATION_STATUS_LABEL, type InspirationDisplayStatus } from "@/modules/inspirations/constants";
import { Badge } from "@/components/ui/badge";

// StatusBadge của Cảm hứng (UX-DR40, DESIGN.md › StatusBadge): Mới nhóm chờ xử lý, Đã dùng nhóm xong, Bỏ qua trung tính.
const STATUS_CLASS: Record<InspirationDisplayStatus, string> = {
  NEW: "bg-tertiary-fixed text-on-tertiary-fixed",
  USED: "bg-secondary-container text-on-secondary-container",
  SKIPPED: "bg-surface-container-high text-on-surface-variant",
};

export function InspirationStatusBadge({ status }: { status: InspirationDisplayStatus }) {
  return <Badge className={STATUS_CLASS[status]}>{INSPIRATION_STATUS_LABEL[status]}</Badge>;
}
