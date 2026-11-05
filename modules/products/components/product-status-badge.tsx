import { Badge } from "@/components/ui/badge";

// StatusBadge của Sản phẩm (DESIGN.md › StatusBadge): hiện chỉ có "Hiện"; Story 2.5 thêm "Ẩn" (trung tính).
export function ProductStatusBadge() {
  return <Badge className="bg-secondary-container text-on-secondary-container">Hiện</Badge>;
}
