import { Badge } from "@/components/ui/badge";

// StatusBadge của Sản phẩm (DESIGN.md › StatusBadge): "Hiện" nhóm xong/đang chạy, "Ẩn" trung tính.
export function ProductStatusBadge({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <Badge className="bg-surface-container-high text-on-surface-variant">Ẩn</Badge>
  ) : (
    <Badge className="bg-secondary-container text-on-secondary-container">Hiện</Badge>
  );
}
