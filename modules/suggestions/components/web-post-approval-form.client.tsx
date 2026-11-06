"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { RiskWarning, WebPostPayload } from "@/modules/posts/types";
import { WebPostSuggestionForm } from "@/modules/posts/components/web-post-suggestion-form.client";
import { approveSuggestion } from "@/modules/suggestions/actions";
import { SuggestionFooter } from "@/modules/suggestions/components/suggestion-footer";

const PUBLISHED = "Bài đã xuất bản — sửa tay ở Soạn Bài web";

// Bài web *Chờ duyệt* trong Bộ nội dung (UX-DR41): form của module chủ đích `posts` + Duyệt / Từ chối / Tạo lại.
// Duyệt ghi `Post` nháp của bộ (AD-19); Bài web đích đã xuất bản → "Duyệt" tắt kèm lý do (server cũng chặn).
export function WebPostApprovalForm({
  suggestionId,
  payload,
  riskWarnings,
  publishedTarget,
  reject,
  regenerate,
}: {
  suggestionId: string;
  payload: WebPostPayload;
  riskWarnings: RiskWarning[];
  publishedTarget: boolean;
  reject: ReactNode;
  regenerate: ReactNode;
}) {
  const router = useRouter();
  const reasonId = `approve-reason-${suggestionId}`;
  const reason = publishedTarget ? PUBLISHED : null;
  return (
    <WebPostSuggestionForm
      defaultValues={payload}
      riskWarnings={riskWarnings}
      action={(values) => approveSuggestion({ id: suggestionId, payload: values })}
      blockedReason={reason}
      reasonId={reasonId}
      onSaved={() => router.refresh()}
      footer={(submit) => (
        <SuggestionFooter approve={submit} reject={reject} regenerate={regenerate} reason={reason} reasonId={reasonId} />
      )}
    />
  );
}
