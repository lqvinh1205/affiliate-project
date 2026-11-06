"use client";

import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PLATFORM_LABEL, type SocialPlatform } from "@/modules/content-sets/constants";
import {
  linkCommentMax,
  socialContentError,
  type SocialContent,
} from "@/modules/content-sets/components/social-content-error";
import { SocialTextField } from "@/modules/content-sets/components/social-text-field.client";
import { ThreadsPartsField } from "@/modules/content-sets/components/threads-parts-field.client";
import type { RiskWarning } from "@/modules/posts/types";
import { RiskWarningList } from "@/modules/posts/components/risk-warning-list.client";
import { recordSuggestionCopy } from "@/modules/suggestions/actions";
import type { ContentSetKind } from "@/modules/suggestions/constants";
import { ApproveButton } from "@/modules/suggestions/components/approve-button.client";
import { SuggestionFooter } from "@/modules/suggestions/components/suggestion-footer";
import { callAction } from "@/components/shared/call-action";
import { UnsavedChangesGuard } from "@/components/shared/unsaved-changes-guard.client";

// Lý do "Duyệt" tắt (UX-DR41, AD-19), theo thứ tự: Bình luận khi bài cùng nền tảng chưa Duyệt; rồi lỗi đầu tiên của
// nội dung theo đúng schema server kiểm (AD-14) — vd. "Bài 3 vượt 500 ký tự", "Bình luận Threads vượt 500 ký tự".
function blockedReason(content: SocialContent, platform: SocialPlatform, postApproved: boolean) {
  if (content.kind === "LINK_COMMENT" && !postApproved) return `Duyệt bài ${PLATFORM_LABEL[platform]} trước`;
  return socialContentError(content, platform);
}

// Bài Threads / Bài Facebook / Bình luận kèm link *Chờ duyệt* (UX-DR41): RiskWarning trên thân (chạm mục bôi câu),
// nội dung sửa được, CopyButton hỏi trước khi chép nội dung chưa Duyệt và ghi `Suggestion.firstCopiedAt` lần đầu
// (FR-22, AD-21); chân thẻ Duyệt / Từ chối / Tạo lại.
export function SocialApprovalForm({
  suggestionId,
  kind,
  platform,
  initial,
  riskWarnings,
  copied,
  postApproved,
  reject,
  regenerate,
}: {
  suggestionId: string;
  kind: Exclude<ContentSetKind, "WEB_POST">;
  platform: SocialPlatform;
  initial: string[];
  riskWarnings: RiskWarning[];
  copied: boolean;
  postApproved: boolean;
  reject: ReactNode;
  regenerate: ReactNode;
}) {
  const [parts, setParts] = useState(initial);
  const [highlight, setHighlight] = useState<{ sentence: string; key: number } | null>(null);
  const recorded = useRef(copied);
  const dirty = JSON.stringify(parts) !== JSON.stringify(initial);

  const content: SocialContent =
    kind === "THREADS_POST"
      ? { kind, posts: parts }
      : kind === "FACEBOOK_POST"
        ? { kind, body: parts[0] ?? "" }
        : { kind, comment: parts[0] ?? "" };
  const reason = blockedReason(content, platform, postApproved);
  const reasonId = `approve-reason-${suggestionId}`;
  const copy = {
    confirmUnapproved: true,
    onCopied: () => {
      if (recorded.current) return;
      recorded.current = true;
      void callAction(() => recordSuggestionCopy({ id: suggestionId }));
    },
  };
  const missing = () => toast.info("Không còn thấy câu này trong nội dung — có thể bạn đã sửa.");
  const payload =
    content.kind === "THREADS_POST"
      ? { posts: content.posts }
      : content.kind === "FACEBOOK_POST"
        ? { body: content.body }
        : { comment: content.comment };

  return (
    <div className="space-y-space-md">
      <UnsavedChangesGuard when={dirty} />
      <RiskWarningList warnings={riskWarnings} onSelect={(w) => setHighlight({ sentence: w.sentence, key: Date.now() })} />
      {kind === "THREADS_POST" ? (
        <ThreadsPartsField
          idPrefix={`s-${suggestionId}`}
          value={parts}
          onChange={setParts}
          copy={copy}
          highlight={highlight}
          onHighlightMissing={missing}
        />
      ) : (
        <SocialTextField
          id={`s-${suggestionId}`}
          label={kind === "FACEBOOK_POST" ? "Bài Facebook" : `Bình luận kèm link ${PLATFORM_LABEL[platform]}`}
          value={parts[0] ?? ""}
          onChange={(v) => setParts([v])}
          countWords={kind === "FACEBOOK_POST"}
          maxChars={kind === "LINK_COMMENT" ? linkCommentMax(platform) : undefined}
          copy={copy}
          highlight={highlight}
          onHighlightMissing={missing}
        />
      )}
      <SuggestionFooter
        approve={
          <ApproveButton
            suggestionId={suggestionId}
            getPayload={() => payload}
            blockedReason={reason}
            reasonId={reasonId}
          />
        }
        reject={reject}
        regenerate={regenerate}
        reason={reason}
        reasonId={reasonId}
      />
    </div>
  );
}
