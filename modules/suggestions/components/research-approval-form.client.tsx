"use client";

import { useRouter } from "next/navigation";
import type { ResearchProfileData } from "@/modules/research/types";
import { ResearchProfileForm } from "@/modules/research/components/research-profile-form.client";
import { approveSuggestion } from "@/modules/suggestions/actions";
import { RegenerateDialog } from "@/modules/suggestions/components/regenerate-dialog.client";
import { RejectSuggestionButton } from "@/modules/suggestions/components/reject-suggestion-button.client";

// Hồ sơ *Chờ duyệt* (FR-22, UX-DR41): sửa rồi "Duyệt" (gửi nội dung đã sửa — ghi `editedBeforeApproval`), hoặc
// "Từ chối" / "Tạo lại". Form là của module chủ đích `research` (AD-11).
export function ResearchApprovalForm({
  suggestionId,
  productId,
  payload,
}: {
  suggestionId: string;
  productId: string;
  payload: ResearchProfileData;
}) {
  const router = useRouter();
  return (
    <ResearchProfileForm
      defaultValues={payload}
      action={(values) => approveSuggestion({ id: suggestionId, payload: values })}
      submitLabel="Duyệt"
      pendingLabel="Đang duyệt…"
      successMessage="Đã duyệt"
      onSaved={() => router.refresh()}
      extraActions={
        <>
          <RejectSuggestionButton id={suggestionId} />
          <RegenerateDialog productId={productId} />
        </>
      }
    />
  );
}
