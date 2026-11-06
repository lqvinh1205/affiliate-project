"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { recordCopy, saveLinkComment, saveSocialPost } from "@/modules/content-sets/actions";
import { PLATFORM_LABEL, THREADS_POST_MAX } from "@/modules/content-sets/constants";
import type { SocialPostForCms } from "@/modules/content-sets/types";
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

function SaveButton({ dirty, pending, onSave, label }: { dirty: boolean; pending: boolean; onSave: () => void; label: string }) {
  if (!dirty && !pending) return null;
  return (
    <Button type="button" size="lg" className="w-full lg:w-auto" disabled={pending} onClick={onSave}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {pending ? "Đang lưu…" : label}
    </Button>
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
  const over = parts.findIndex((p) => p.length > THREADS_POST_MAX);
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
      {over >= 0 && <p className="text-body-sm text-error">Bài {over + 1} vượt {THREADS_POST_MAX} ký tự</p>}
      <SaveButton dirty={dirty} pending={pending} onSave={save} label="Lưu thay đổi" />
    </div>
  );
}

// Bình luận kèm link đã Duyệt (`SocialPost.linkComment`): sửa tiếp, sao chép ghi `firstCopiedAt` lần đầu.
export function LinkCommentEditor({ post }: { post: SocialPostForCms }) {
  const [comment, setComment] = useState(post.linkComment ?? "");
  const [saved, setSaved] = useState(post.linkComment ?? "");
  const onCopied = useRecordCopy(post.id, !!post.firstCopiedAt);
  const dirty = comment !== saved;
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
        copy={{ confirmUnapproved: false, onCopied }}
      />
      <SaveButton dirty={dirty} pending={pending} onSave={save} label="Lưu bình luận" />
    </div>
  );
}
