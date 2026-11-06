import { LoaderCircle } from "lucide-react";
import { SUGGESTION_STATUS_LABEL, type VisibleSuggestionStatus } from "@/modules/suggestions/constants";
import { Badge } from "@/components/ui/badge";

// StatusBadge của Gợi ý AI (UX-DR40): luôn có chữ. Trung tính: Đang tạo, Đã từ chối; chờ xử lý: Chờ duyệt;
// xong: Đã duyệt; lỗi: Lỗi. "Đang tạo" có icon quay (dừng khi reduced-motion — globals.css).
const STYLES: Record<VisibleSuggestionStatus, string> = {
  GENERATING: "bg-surface-container-high text-on-surface-variant",
  PENDING: "bg-tertiary-fixed text-on-tertiary-fixed",
  APPROVED: "bg-secondary-container text-on-secondary-container",
  REJECTED: "bg-surface-container-high text-on-surface-variant",
  FAILED: "bg-error-container text-on-error-container",
};

export function SuggestionStatusBadge({ status }: { status: VisibleSuggestionStatus }) {
  return (
    <Badge className={STYLES[status]}>
      {status === "GENERATING" && <LoaderCircle className="animate-spin" aria-hidden />}
      {SUGGESTION_STATUS_LABEL[status]}
    </Badge>
  );
}
