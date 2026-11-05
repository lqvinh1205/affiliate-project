"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, moveCategory } from "@/modules/categories/actions";
import type { MoveDirection } from "@/modules/categories/schema";
import { callAction } from "@/components/shared/call-action";
import { ConfirmDialog } from "@/components/shared/confirm-dialog.client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";

type Item = { id: string; name: string; slug: string; posts: number; products: number };

function moved(list: Item[], { id, direction }: { id: string; direction: MoveDirection }) {
  const from = list.findIndex((x) => x.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

function RowActions({
  item,
  index,
  count,
  busy,
  moving,
  onMove,
  onDelete,
}: {
  item: Item;
  index: number;
  count: number;
  busy: boolean;
  moving: MoveDirection | null;
  onMove: (direction: MoveDirection, button: HTMLButtonElement) => void;
  onDelete: () => void;
}) {
  // Khi đang lưu chỉ đặt aria-disabled (không `disabled`) để nút đang focus không mất focus.
  const arrow = (direction: MoveDirection, label: string, atEnd: boolean, Icon: typeof ArrowUp) => (
    <Button
      variant="outline"
      size="icon-lg"
      data-move={direction}
      aria-label={`Đưa "${item.name}" ${label}`}
      aria-disabled={busy || undefined}
      disabled={atEnd}
      onClick={(e) => !busy && onMove(direction, e.currentTarget)}
    >
      {moving === direction ? <Loader2 className="animate-spin" aria-hidden /> : <Icon aria-hidden />}
    </Button>
  );
  return (
    <div className="flex items-center gap-2">
      {arrow("up", "lên", index === 0, ArrowUp)}
      {arrow("down", "xuống", index === count - 1, ArrowDown)}
      <Link
        href={`/cms/danh-muc/${item.id}`}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-touch-target lg:min-h-0")}
      >
        <Pencil aria-hidden /> Sửa
      </Link>
      <Button variant="ghost" size="lg" className="text-destructive" disabled={busy} onClick={onDelete}>
        <Trash2 aria-hidden /> Xoá
      </Button>
    </div>
  );
}

// Danh sách Danh mục (UX-DR78): mobile là Card, desktop là bảng; lên/xuống đổi chỗ ngay rồi lưu.
export function CategoryList({ items }: { items: Item[] }) {
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
      const res = await callAction(() => moveCategory({ id: item.id, direction }));
      setMoving(null);
      if (res.ok) {
        toast.success("Đã lưu thứ tự");
        setAnnouncement(`Đã chuyển ${item.name} ${direction === "up" ? "lên" : "xuống"} vị trí ${position}`);
      } else {
        toast.error(res.error);
      }
      router.refresh();
    });
  };

  const onDelete = (item: Item) => {
    // Chặn ngay ở client khi đã biết còn tham chiếu; server vẫn chặn nếu bài vừa được gắn (FK Restrict).
    if (item.posts > 0 || item.products > 0) {
      toast.error(
        `Danh mục còn ${item.posts} Bài web và ${item.products} Sản phẩm. Chuyển sang Danh mục khác trước.`,
      );
      return;
    }
    setTarget(item);
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    const res = await callAction(() => deleteCategory({ id: target.id }));
    setDeleting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Đã xoá Danh mục");
    setTarget(null);
    router.refresh();
  };

  const busy = pending || deleting;
  const actions = (item: Item, i: number) => (
    <RowActions
      item={item}
      index={i}
      count={list.length}
      busy={busy}
      moving={moving?.id === item.id ? moving.direction : null}
      onMove={(direction, button) => onMove(item, direction, button)}
      onDelete={() => onDelete(item)}
    />
  );
  const usage = (item: Item) => `${item.posts} Bài web · ${item.products} Sản phẩm`;

  return (
    <>
      <ul className="space-y-space-sm lg:hidden">
        {list.map((item, i) => (
          <li key={item.id} className="space-y-space-sm rounded-xl border bg-card p-space-md">
            <div className="min-w-0">
              <p className="truncate font-semibold">{item.name}</p>
              <p className="truncate text-body-sm text-on-surface-variant">
                /{item.slug} <span aria-hidden>·</span> {usage(item)}
              </p>
            </div>
            {actions(item, i)}
          </li>
        ))}
      </ul>

      <table className="hidden w-full text-left text-body-sm lg:table">
        <thead className="text-on-surface-variant">
          <tr className="border-b">
            <th scope="col" className="py-2 pr-4 font-medium">Tên</th>
            <th scope="col" className="py-2 pr-4 font-medium">Đường dẫn</th>
            <th scope="col" className="py-2 pr-4 font-medium">Đang dùng</th>
            <th scope="col" className="py-2 font-medium"><span className="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          {list.map((item, i) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-semibold">{item.name}</td>
              <td className="py-2 pr-4 text-on-surface-variant">/{item.slug}</td>
              <td className="whitespace-nowrap py-2 pr-4 text-on-surface-variant">{usage(item)}</td>
              <td className="py-2">{actions(item, i)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={`Xoá Danh mục "${target?.name ?? ""}"?`}
        description="Danh mục sẽ bị xoá vĩnh viễn và biến mất khỏi website."
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
