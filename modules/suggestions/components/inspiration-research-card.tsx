import { Info } from "lucide-react";
import type { InspirationResearchForCms } from "@/modules/research/types";
import { InspirationResearchEditor } from "@/modules/research/components/inspiration-research-editor.client";
import { inspirationSkippedMessages } from "@/modules/suggestions/inspiration-skipped";
import type { InspirationResearchSuggestionView } from "@/modules/suggestions/types";
import { GeneratingIndicator } from "@/modules/suggestions/components/generating-indicator.client";
import { InspirationResearchApprovalForm } from "@/modules/suggestions/components/inspiration-research-approval-form.client";
import { RegenerateDialog } from "@/modules/suggestions/components/regenerate-dialog.client";
import { ResearchButton } from "@/modules/suggestions/components/research-button.client";
import { SuggestionCard } from "@/modules/suggestions/components/suggestion-card";
import { SuggestionError } from "@/modules/suggestions/components/suggestion-error";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TITLE = "Từ khoá Shopee và dàn ý";
const HEADING_ID = "inspiration-research";

// Dải `skipped` của hồ sơ Cảm hứng (UX-DR77): không đọc được video → nói rõ hồ sơ dựa trên gì, gợi ý thêm ảnh khi chưa có.
function InspirationSkippedNotice({
  skipped,
  mediaKind,
}: {
  skipped: InspirationResearchSuggestionView["skipped"];
  mediaKind: "image" | "video" | null;
}) {
  if (skipped.length === 0) return null;
  return (
    <Alert role="status" className="border-0 bg-surface-container-high text-on-surface">
      <Info aria-hidden />
      <AlertDescription className="text-body-sm text-on-surface">
        {inspirationSkippedMessages(skipped, mediaKind).map((m) => (
          <p key={m}>{m}</p>
        ))}
      </AlertDescription>
    </Alert>
  );
}

// SuggestionCard `RESEARCH` của Chi tiết Cảm hứng (FR-2, UX-DR77), theo trạng thái gợi ý mới nhất: chưa có → "Nghiên
// cứu"; Đang tạo → GeneratingIndicator; Chờ duyệt → dải `skipped` + form sửa rồi Duyệt / Từ chối / Tạo lại; Đã duyệt →
// form sửa hồ sơ đích (module `research`); Đã từ chối → đầu thẻ + Tạo lại; Lỗi → Alert + Tạo lại.
export function InspirationResearchCard({
  inspirationId,
  mediaKind,
  suggestion,
  profile,
}: {
  inspirationId: string;
  mediaKind: "image" | "video" | null;
  suggestion: InspirationResearchSuggestionView | null;
  profile: InspirationResearchForCms | null;
}) {
  if (!suggestion) {
    return (
      <SuggestionCard
        title={TITLE}
        status={null}
        headingId={HEADING_ID}
        footer={<ResearchButton inspirationId={inspirationId} />}
      >
        <p className="text-body-sm text-on-surface-variant">
          AI đọc link, ảnh và ghi chú để gợi ý từ khoá tìm Sản phẩm trên Shopee và dàn ý bài mẹo. Việc chạy nền: rời màn
          hình rồi quay lại vẫn thấy kết quả.
        </p>
      </SuggestionCard>
    );
  }

  const { status } = suggestion;
  const regenerate = <RegenerateDialog inspirationId={inspirationId} variant="outline" />;

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
        <InspirationSkippedNotice skipped={suggestion.skipped} mediaKind={mediaKind} />
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
        <InspirationResearchApprovalForm suggestionId={suggestion.id} inspirationId={inspirationId} payload={suggestion.payload} />
      </SuggestionCard>
    );
  }
  // Đã duyệt: sửa hồ sơ đích; sửa không đổi trạng thái gợi ý (FR-22, AD-19).
  return (
    <SuggestionCard title={TITLE} status="APPROVED" headingId={HEADING_ID}>
      {profile ? (
        <InspirationResearchEditor key={profile.id} inspirationId={inspirationId} data={profile.data} />
      ) : (
        <p className="text-body-sm text-on-surface-variant">Không đọc được hồ sơ đã duyệt. Tải lại trang.</p>
      )}
    </SuggestionCard>
  );
}
