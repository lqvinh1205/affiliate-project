"use client";

import { useRouter } from "next/navigation";
import { InspirationResearchForm } from "@/modules/research/components/inspiration-research-form.client";
import type { InspirationResearchData } from "@/modules/research/types";
import { approveSuggestion } from "@/modules/suggestions/actions";
import { RegenerateDialog } from "@/modules/suggestions/components/regenerate-dialog.client";
import { RejectSuggestionButton } from "@/modules/suggestions/components/reject-suggestion-button.client";

// Hồ sơ Cảm hứng *Chờ duyệt* (FR-2, FR-22): sửa rồi "Duyệt" (gửi nội dung đã sửa — ghi `editedBeforeApproval`), hoặc
// "Từ chối" / "Tạo lại". Form là của module chủ đích `research` (AD-11).
export function InspirationResearchApprovalForm({
  suggestionId,
  inspirationId,
  payload,
}: {
  suggestionId: string;
  inspirationId: string;
  payload: InspirationResearchData;
}) {
  const router = useRouter();
  return (
    <InspirationResearchForm
      defaultValues={payload}
      action={(values) => approveSuggestion({ id: suggestionId, payload: values })}
      submitLabel="Duyệt"
      pendingLabel="Đang duyệt…"
      successMessage="Đã duyệt"
      onSaved={() => router.refresh()}
      extraActions={
        <>
          <RejectSuggestionButton id={suggestionId} />
          <RegenerateDialog inspirationId={inspirationId} />
        </>
      }
    />
  );
}
