import type { Status } from "@/generated/prisma/enums";
import { POST_STATUS_LABEL } from "@/modules/posts/constants";
import { Badge } from "@/components/ui/badge";

// StatusBadge của Bài web (UX-DR40): luôn có chữ; "Đã xuất bản" nhóm xong/đang chạy, "Nháp" trung tính.
const STYLES: Record<Status, string> = {
  PUBLISHED: "bg-secondary-container text-on-secondary-container",
  DRAFT: "bg-surface-container-high text-on-surface-variant",
};

export function PostStatusBadge({ status }: { status: Status }) {
  return <Badge className={STYLES[status]}>{POST_STATUS_LABEL[status]}</Badge>;
}
