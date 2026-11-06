"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBanner, moveBanner } from "@/modules/banners/actions";
import type { BannerStatus } from "@/modules/banners/constants";
import type { MoveDirection } from "@/modules/banners/schema";
import { BannerStatusBadge } from "@/modules/banners/components/banner-status-badge";
import { callAction } from "@/components/shared/call-action";
import { ConfirmDialog } from "@/components/shared/confirm-dialog.client";
import { ImageFallback } from "@/components/shared/image-fallback.client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";

type Item = { id: string; title: string; image: string; status: BannerStatus; schedule: string };

function moved(list: Item[], { id, direction }: { id: string; direction: MoveDirection }) {
  const from = list.findIndex((x) => x.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

// Danh sách Banner (UX-DR79): thẻ ảnh 2:1 + tiêu đề + StatusBadge + lịch; lên/xuống đổi chỗ ngay rồi lưu (UX-DR85,
// không kéo-thả); xoá qua ConfirmDialog (focus mặc định "Huỷ").
export function BannerList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [list, applyMove] = useOptimistic(items, moved);
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState<{ id: string; direction: MoveDirection } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const movedButton = useRef<HTMLButtonElement | null>(null);

  // Nút vừa bấm thành `disabled` khi mục tới đầu/cuối: chuyển focus sang mũi tên còn lại của dòng.
  useLayoutEffect(() => {
    const el = movedButton.current;
    if (!el?.disabled) return;
    el.parentElement?.querySelector<HTMLButtonElement>("button[data-move]:not(:disabled)")?.focus();
  }, [list]);

  const onMove = (item: Item, direction: MoveDirection, button: HTMLButtonElement) => {
    const from = list.findIndex((x) => x.id === item.id);
    const position = direction === "up" ? from : from + 2;
    movedButton.current = button;
    setMoving({ id: item.id, direction });
    startTransition(async () => {
      applyMove({ id: item.id, direction });
      const res = await callAction(() => moveBanner({ id: item.id, direction }));
      setMoving(null);
      if (res.ok) {
        toast.success("Đã lưu thứ tự");
        setAnnouncement(`Đã chuyển ${item.title} ${direction === "up" ? "lên" : "xuống"} vị trí ${position}`);
      } else {
        toast.error(res.error);
      }
      router.refresh();
    });
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    const res = await callAction(() => deleteBanner({ id: target.id }));
    setDeleting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Đã xoá Banner");
    setTarget(null);
    router.refresh();
  };

  const busy = pending || deleting;
  // Khi đang lưu chỉ đặt aria-disabled (không `disabled`) để nút đang focus không mất focus.
  const arrow = (item: Item, i: number, direction: MoveDirection) => {
    const Icon = direction === "up" ? ArrowUp : ArrowDown;
    const atEnd = direction === "up" ? i === 0 : i === list.length - 1;
    const spinning = moving?.id === item.id && moving.direction === direction;
    return (
      <Button
        variant="outline"
        size="icon-lg"
        data-move={direction}
        aria-label={`Đưa "${item.title}" ${direction === "up" ? "lên" : "xuống"}`}
        aria-disabled={busy || undefined}
        disabled={atEnd}
        onClick={(e) => !busy && onMove(item, direction, e.currentTarget)}
      >
        {spinning ? <Loader2 className="animate-spin" aria-hidden /> : <Icon aria-hidden />}
      </Button>
    );
  };

  return (
    <>
      <ul className="space-y-space-sm">
        {list.map((item, i) => (
          <li key={item.id} className="flex flex-wrap items-center gap-space-md rounded-xl border bg-card p-space-md">
            <span className="relative block aspect-[2/1] w-24 shrink-0 overflow-hidden rounded-md bg-surface-container">
              <ImageFallback src={item.image} alt="" fill sizes="96px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1 basis-40 space-y-1">
              <p className="line-clamp-2 font-semibold">{item.title}</p>
              <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1 text-body-sm text-on-surface-variant">
                <BannerStatusBadge status={item.status} />
                <span>{item.schedule}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {arrow(item, i, "up")}
              {arrow(item, i, "down")}
              <Link
                href={`/cms/banner/${item.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-touch-target lg:min-h-0")}
              >
                <Pencil aria-hidden /> Sửa
              </Link>
              <Button variant="ghost" size="lg" className="text-destructive" disabled={busy} onClick={() => setTarget(item)}>
                <Trash2 aria-hidden /> Xoá
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={`Xoá Banner "${target?.title ?? ""}"?`}
        description="Banner sẽ bị xoá vĩnh viễn và biến mất khỏi Trang chủ. Muốn tạm ẩn thì tắt Banner thay vì xoá."
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
