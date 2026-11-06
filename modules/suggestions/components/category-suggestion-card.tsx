import { SUGGESTION_KIND_LABEL } from "@/modules/suggestions/constants";
import type { CategorySuggestionView } from "@/modules/suggestions/types";
import { CategorySuggestionActions } from "@/modules/suggestions/components/category-suggestion-actions.client";
import { GeneratingIndicator } from "@/modules/suggestions/components/generating-indicator.client";
import { SuggestionCard } from "@/modules/suggestions/components/suggestion-card";
import { SuggestionError } from "@/modules/suggestions/components/suggestion-error";

const TITLE = SUGGESTION_KIND_LABEL.PRODUCT_CATEGORY;
const HEADING_ID = "category-suggestion";

// Thẻ "Danh mục gợi ý" (UX-DR45, FR-11): ngay dưới ResearchProfileCard, sinh cùng lần nghiên cứu, Duyệt riêng →
// ghi Danh mục của Sản phẩm. Không có "Tạo lại" (Tạo lại hồ sơ thay cả thẻ này); Vinh vẫn chọn tay trên form.
export function CategorySuggestionCard({ suggestion }: { suggestion: CategorySuggestionView }) {
  const { status, payload } = suggestion;
  if (status === "GENERATING") {
    return (
      <SuggestionCard title={TITLE} status={status} headingId={HEADING_ID}>
        <GeneratingIndicator label="Đang chọn Danh mục…" startedAt={suggestion.createdAt} />
      </SuggestionCard>
    );
  }
  if (status === "REJECTED") return <SuggestionCard title={TITLE} status={status} headingId={HEADING_ID} />;
  if (status === "FAILED" || !payload) {
    return (
      <SuggestionCard title={TITLE} status="FAILED" headingId={HEADING_ID}>
        <SuggestionError message={status === "FAILED" ? suggestion.errorMessage : null} />
      </SuggestionCard>
    );
  }
  return (
    <SuggestionCard
      title={TITLE}
      status={status}
      headingId={HEADING_ID}
      footer={status === "PENDING" ? <CategorySuggestionActions id={suggestion.id} /> : undefined}
    >
      <p className="text-label-md">{payload.categoryName}</p>
      {payload.reason && <p className="text-body-sm text-on-surface-variant">{payload.reason}</p>}
      {status === "APPROVED" && (
        <p className="text-body-sm text-on-surface-variant">Đã đặt làm Danh mục của Sản phẩm. Đổi tay ở ô Danh mục phía trên.</p>
      )}
    </SuggestionCard>
  );
}
