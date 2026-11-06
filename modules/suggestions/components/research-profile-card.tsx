import type { ResearchProfileForCms } from "@/modules/research/types";
import { ResearchProfileEditor } from "@/modules/research/components/research-profile-editor.client";
import { SUGGESTION_KIND_LABEL } from "@/modules/suggestions/constants";
import type { ResearchSuggestionView } from "@/modules/suggestions/types";
import { GeneratingIndicator } from "@/modules/suggestions/components/generating-indicator.client";
import { RegenerateDialog } from "@/modules/suggestions/components/regenerate-dialog.client";
import { ResearchApprovalForm } from "@/modules/suggestions/components/research-approval-form.client";
import { ResearchButton } from "@/modules/suggestions/components/research-button.client";
import { SkippedNotice } from "@/modules/suggestions/components/skipped-notice";
import { SuggestionCard } from "@/modules/suggestions/components/suggestion-card";
import { SuggestionError } from "@/modules/suggestions/components/suggestion-error";

const TITLE = SUGGESTION_KIND_LABEL.RESEARCH;
const HEADING_ID = "research-profile";

// ResearchProfileCard (UX-DR45): SuggestionCard `RESEARCH` ở Chi tiết Sản phẩm, theo trạng thái gợi ý mới nhất.
// Chưa có hồ sơ → chỉ nút "Nghiên cứu"; Đang tạo → GeneratingIndicator; Chờ duyệt → dải `skipped` + form sửa rồi
// Duyệt / Từ chối / Tạo lại; Đã duyệt → form sửa `ResearchProfile` (đích, module `research`); Đã từ chối → chỉ đầu thẻ
// + Tạo lại; Lỗi → Alert + Tạo lại.
export function ResearchProfileCard({
  productId,
  suggestion,
  profile,
}: {
  productId: string;
  suggestion: ResearchSuggestionView | null;
  profile: ResearchProfileForCms | null;
}) {
  if (!suggestion) {
    return (
      <SuggestionCard title={TITLE} status={null} headingId={HEADING_ID} footer={<ResearchButton productId={productId} />}>
        <p className="text-body-sm text-on-surface-variant">
          Chưa có hồ sơ. AI tìm thông tin trên web, đọc ảnh, tóm tắt đánh giá trong Dữ liệu thô, gợi ý Người đọc mục
          tiêu, Góc viết và Danh mục. Việc chạy nền: rời màn hình rồi quay lại vẫn thấy kết quả.
        </p>
      </SuggestionCard>
    );
  }

  const { status } = suggestion;
  const regenerate = <RegenerateDialog productId={productId} variant="outline" />;

  if (status === "GENERATING") {
    return (
      <SuggestionCard title={TITLE} status={status} headingId={HEADING_ID}>
        <GeneratingIndicator label="Đang nghiên cứu…" startedAt={suggestion.createdAt} />
      </SuggestionCard>
    );
  }
  if (status === "REJECTED") {
    return <SuggestionCard title={TITLE} status={status} headingId={HEADING_ID} footer={regenerate} />;
  }
  if (status === "FAILED" || (status === "PENDING" && !suggestion.payload)) {
    return (
      <SuggestionCard title={TITLE} status="FAILED" headingId={HEADING_ID} footer={regenerate}>
        <SuggestionError message={status === "FAILED" ? suggestion.errorMessage : null} />
      </SuggestionCard>
    );
  }
  if (status === "PENDING" && suggestion.payload) {
    return (
      <SuggestionCard title={TITLE} status={status} headingId={HEADING_ID}>
        <SkippedNotice skipped={suggestion.skipped} />
        {suggestion.sources.length > 0 && (
          <details className="text-body-sm">
            <summary className="min-h-touch-target cursor-pointer content-center text-on-surface-variant">
              {suggestion.sources.length} nguồn AI đã đọc
            </summary>
            <ul className="space-y-1 pl-space-md">
              {suggestion.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-primary underline-offset-4 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
        <ResearchApprovalForm suggestionId={suggestion.id} productId={productId} payload={suggestion.payload} />
      </SuggestionCard>
    );
  }
  // Đã duyệt: thẻ hiện và sửa hồ sơ đích; sửa không đổi trạng thái (FR-22, AD-19).
  return (
    <SuggestionCard title={TITLE} status="APPROVED" headingId={HEADING_ID}>
      {profile ? (
        <ResearchProfileEditor key={profile.id} productId={productId} data={profile.data} />
      ) : (
        <p className="text-body-sm text-on-surface-variant">Không đọc được hồ sơ đã duyệt. Tải lại trang.</p>
      )}
    </SuggestionCard>
  );
}
