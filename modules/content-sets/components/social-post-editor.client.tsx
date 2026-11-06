"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { recordCopy, saveLinkComment, saveSocialPost } from "@/modules/content-sets/actions";
import { PLATFORM_LABEL, type SocialPlatform } from "@/modules/content-sets/constants";
import type { SocialPostForCms } from "@/modules/content-sets/types";
import { linkCommentMax, socialContentError } from "@/modules/content-sets/components/social-content-error";
import { SocialTextField } from "@/modules/content-sets/components/social-text-field.client";
import { ThreadsPartsField } from "@/modules/content-sets/components/threads-parts-field.client";
import { callAction } from "@/components/shared/call-action";
import { UnsavedChangesGuard } from "@/components/shared/unsaved-changes-guard.client";
import { Button } from "@/components/ui/button";

// Ghi mốc sao chép đầu tiên sau Duyệt (AD-21) — một lần mỗi lần mở màn; server cũng chỉ ghi lần đầu.
function useRecordCopy(id: string, alreadyCopied: boolean) {
  const done = useRef(alreadyCopied);
  return () => {
    if (done.current) return;
    done.current = true;
    void callAction(() => recordCopy({ id }));
  };
}

// Nút Lưu hiện khi có thay đổi; `error` (lỗi theo schema server kiểm — AD-14) tắt nút và hiện lý do ngay dưới.
function SaveButton({
  dirty,
  pending,
  onSave,
  label,
  error,
  id,
}: {
  dirty: boolean;
  pending: boolean;
  onSave: () => void;
  label: string;
  error: string | null;
  id: string;
}) {
  if (!dirty && !pending) return null;
  return (
    <div className="space-y-space-sm">
      {error && (
        <p id={id} className="text-body-sm text-error">
          {error}
        </p>
      )}
      <Button
        type="button"
        size="lg"
        className="w-full lg:w-auto"
        disabled={pending || !!error}
        aria-describedby={error ? id : undefined}
        onClick={onSave}
      >
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {pending ? "Đang lưu…" : label}
      </Button>
    </div>
  );
}

function useSave(action: () => Promise<Result<{ id: string }>>, onSaved: () => void) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const save = () =>
    startTransition(async () => {
      const res = await callAction(action);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Đã lưu");
      onSaved();
      router.refresh();
    });
  return { pending, save };
}

// Bài Threads / Facebook đã Duyệt (đích `SocialPost` — AD-19, UX-DR41): sửa tiếp được, không đổi trạng thái gợi ý
// (FR-22); CopyButton chép ngay (đã Duyệt) và ghi `firstCopiedAt` lần đầu qua `content-sets.recordCopy`.
export function SocialPostEditor({ post }: { post: SocialPostForCms }) {
  const [parts, setParts] = useState(post.parts);
  const [saved, setSaved] = useState(post.parts);
  const onCopied = useRecordCopy(post.id, !!post.firstCopiedAt);
  const dirty = JSON.stringify(parts) !== JSON.stringify(saved);
  const platform = post.platform as SocialPlatform;
  const error = socialContentError(
    platform === "THREADS" ? { kind: "THREADS_POST", posts: parts } : { kind: "FACEBOOK_POST", body: parts[0] ?? "" },
    platform,
  );
  const { pending, save } = useSave(
    () => saveSocialPost({ id: post.id, content: post.platform === "THREADS" ? { posts: parts } : { body: parts[0] ?? "" } }),
    () => setSaved(parts),
  );
  const copy = { confirmUnapproved: false, onCopied };

  return (
    <div className="space-y-space-md">
      <UnsavedChangesGuard when={dirty && !pending} />
      {post.platform === "THREADS" ? (
        <ThreadsPartsField idPrefix={`social-${post.id}`} value={parts} onChange={setParts} copy={copy} />
      ) : (
        <SocialTextField
          id={`social-${post.id}`}
          label={`Bài ${PLATFORM_LABEL[post.platform]}`}
          value={parts[0] ?? ""}
          onChange={(v) => setParts([v])}
          countWords
          copy={copy}
        />
      )}
      <SaveButton dirty={dirty} pending={pending} onSave={save} label="Lưu thay đổi" error={error} id={`social-${post.id}-error`} />
    </div>
  );
}

// Bình luận kèm link đã Duyệt (`SocialPost.linkComment`): sửa tiếp, sao chép ghi `firstCopiedAt` lần đầu.
export function LinkCommentEditor({ post }: { post: SocialPostForCms }) {
  const [comment, setComment] = useState(post.linkComment ?? "");
  const [saved, setSaved] = useState(post.linkComment ?? "");
  const onCopied = useRecordCopy(post.id, !!post.firstCopiedAt);
  const dirty = comment !== saved;
  const platform = post.platform as SocialPlatform;
  const error = socialContentError({ kind: "LINK_COMMENT", comment }, platform);
  const { pending, save } = useSave(
    () => saveLinkComment({ id: post.id, content: { comment } }),
    () => setSaved(comment),
  );
  return (
    <div className="space-y-space-md">
      <UnsavedChangesGuard when={dirty && !pending} />
      <SocialTextField
        id={`comment-${post.id}`}
        label="Bình luận kèm link"
        value={comment}
        onChange={setComment}
        maxChars={linkCommentMax(platform)}
        copy={{ confirmUnapproved: false, onCopied }}
      />
      <SaveButton dirty={dirty} pending={pending} onSave={save} label="Lưu bình luận" error={error} id={`comment-${post.id}-error`} />
    </div>
  );
}
