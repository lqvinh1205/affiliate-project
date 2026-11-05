"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Loader2, Send, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Status } from "@/generated/prisma/enums";
import { deletePost, setPostStatus } from "@/modules/posts/actions";
import { PostStatusBadge } from "@/modules/posts/components/post-status-badge";
import { callAction } from "@/components/shared/call-action";
import { ConfirmDialog } from "@/components/shared/confirm-dialog.client";
import { Button } from "@/components/ui/button";

// Thanh thao tác của trình soạn bài: StatusBadge, "Xem trên site", Xem trước, Xuất bản / Chuyển về nháp, Xoá.
// Chuyển về nháp và Xoá qua ConfirmDialog (UX-DR58); xuất bản khi form còn thay đổi chưa lưu thì `canPublish` chặn.
export function PostActionBar({
  id,
  title,
  slug,
  status,
  onStatusChange,
  canPublish,
  onPreview,
}: {
  id: string;
  // Tiêu đề hiện tại trong form (hộp xác nhận nêu đúng bài đang sửa).
  title: string;
  slug: string;
  status: Status;
  onStatusChange: (status: Status) => void;
  canPublish: () => boolean;
  onPreview: () => void;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"delete" | "unpublish" | null>(null);
  const [busy, setBusy] = useState<"status" | "delete" | null>(null);
  const [, startTransition] = useTransition();
  const name = title.trim() || "Chưa có tiêu đề";

  const act = (key: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setBusy(key);
    startTransition(async () => {
      try {
        await fn();
      } finally {
        setBusy(null);
      }
    });
  };

  const changeStatus = (next: Status) =>
    act("status", async () => {
      const res = await callAction(() => setPostStatus({ id, status: next }));
      setConfirm(null);
      if (!res.ok) return void toast.error(res.error);
      onStatusChange(res.status);
      toast.success(next === "PUBLISHED" ? "Đã xuất bản" : "Đã chuyển bài về nháp");
      router.refresh();
    });

  const onDelete = () =>
    act("delete", async () => {
      const res = await callAction(() => deletePost({ id }));
      if (!res.ok) {
        setConfirm(null);
        return void toast.error(res.error);
      }
      toast.success("Đã xoá bài");
      router.push("/cms/bai-viet");
    });

  return (
    <div className="flex flex-wrap items-center gap-space-sm">
      <PostStatusBadge status={status} />
      {status === "PUBLISHED" && (
        <Link
          href={`/bai-viet/${slug}`}
          target="_blank"
          className="inline-flex min-h-touch-target items-center text-label-md text-primary hover:underline"
        >
          Xem trên site<span className="sr-only"> (mở tab mới)</span>
        </Link>
      )}
      <div className="flex w-full flex-wrap gap-space-sm sm:ml-auto sm:w-auto">
        <Button type="button" variant="outline" size="lg" onClick={onPreview}>
          <Eye aria-hidden /> Xem trước
        </Button>
        {status === "PUBLISHED" ? (
          <Button type="button" variant="outline" size="lg" disabled={!!busy} onClick={() => setConfirm("unpublish")}>
            <Undo2 aria-hidden /> Chuyển về nháp
          </Button>
        ) : (
          <Button type="button" size="lg" disabled={!!busy} onClick={() => canPublish() && changeStatus("PUBLISHED")}>
            {busy === "status" ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {busy === "status" ? "Đang xuất bản…" : "Xuất bản"}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="text-destructive hover:text-destructive"
          disabled={!!busy}
          onClick={() => setConfirm("delete")}
        >
          <Trash2 aria-hidden /> Xoá
        </Button>
      </div>

      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Xoá bài "${name}"?`}
        description="Bài biến khỏi website và không khôi phục được. Sản phẩm đã gắn vẫn còn trong Kho."
        pending={busy === "delete"}
        onConfirm={onDelete}
      />
      <ConfirmDialog
        open={confirm === "unpublish"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Chuyển bài "${name}" về nháp?`}
        description="Bài biến khỏi website cho tới khi xuất bản lại; link đã chia sẻ tạm không mở được."
        confirmLabel="Chuyển về nháp"
        pendingLabel="Đang chuyển…"
        pending={busy === "status"}
        onConfirm={() => changeStatus("DRAFT")}
      />
    </div>
  );
}
