"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { moveBioItem, setBioItemPinned, setBioItemVisible } from "@/modules/bio/actions";
import type { BioCmsItem } from "@/modules/bio/types";
import { callAction } from "@/components/shared/call-action";
import { ImageFallback } from "@/components/shared/image-fallback.client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Lists = { pinned: BioCmsItem[]; rest: BioCmsItem[] };
type Change =
  | { type: "visible"; id: string; visible: boolean }
  | { type: "pin"; id: string; pinned: boolean }
  | { type: "move"; id: string; direction: "up" | "down" };

function swap(list: BioCmsItem[], id: string, direction: "up" | "down") {
  const from = list.findIndex((x) => x.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

// Đổi ngay trên màn trước khi server trả lời. Bỏ ghim: món tạm đứng đầu nhóm còn lại (server xếp lại theo ngày tạo
// rồi `router.refresh()` cập nhật).
function applyChange(lists: Lists, change: Change): Lists {
  const all = [...lists.pinned, ...lists.rest];
  const item = all.find((x) => x.id === change.id);
  if (!item) return lists;
  if (change.type === "visible") {
    const set = (l: BioCmsItem[]) => l.map((x) => (x.id === change.id ? { ...x, visible: change.visible } : x));
    return { pinned: set(lists.pinned), rest: set(lists.rest) };
  }
  if (change.type === "pin") {
    const without = (l: BioCmsItem[]) => l.filter((x) => x.id !== change.id);
    const moved = { ...item, pinned: change.pinned };
    return change.pinned
      ? { pinned: [...without(lists.pinned), moved], rest: without(lists.rest) }
      : { pinned: without(lists.pinned), rest: [moved, ...without(lists.rest)] };
  }
  return item.pinned
    ? { ...lists, pinned: swap(lists.pinned, change.id, change.direction) }
    : { ...lists, rest: swap(lists.rest, change.id, change.direction) };
}

function Row({
  item,
  index,
  count,
  busy,
  onChange,
}: {
  item: BioCmsItem;
  index: number;
  count: number;
  busy: boolean;
  onChange: (change: Change) => void;
}) {
  const switchId = `bio-visible-${item.id}`;
  // Khi đang lưu chỉ đặt aria-disabled (không `disabled`) để nút đang focus không mất focus.
  const guard = (fn: () => void) => () => !busy && fn();
  return (
    <li className="flex flex-wrap items-center gap-x-space-md gap-y-space-sm py-space-sm">
      <span className="relative block size-10 shrink-0 overflow-hidden rounded-md bg-surface-container">
        <ImageFallback src={item.image} alt="" fill sizes="40px" className="object-cover" />
      </span>
      <p className="min-w-0 flex-1 basis-40 font-semibold">
        <span className="line-clamp-2">{item.name}</span>
        {!item.visible && <span className="block text-body-sm font-normal text-on-surface-variant">Đang tắt trên bio</span>}
      </p>
      <div className="flex items-center gap-space-sm">
        <label htmlFor={switchId} className="flex min-h-touch-target cursor-pointer items-center gap-space-sm text-label-md">
          <Switch
            id={switchId}
            checked={item.visible}
            aria-disabled={busy || undefined}
            onCheckedChange={(visible) => !busy && onChange({ type: "visible", id: item.id, visible })}
          />
          Hiện trên bio
        </label>
        <Button
          variant="outline"
          size="icon-lg"
          aria-pressed={item.pinned}
          aria-label={item.pinned ? `Bỏ ghim "${item.name}"` : `Ghim "${item.name}"`}
          aria-disabled={busy || undefined}
          className={item.pinned ? "bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed/80" : undefined}
          onClick={guard(() => onChange({ type: "pin", id: item.id, pinned: !item.pinned }))}
        >
          {item.pinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
        </Button>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={`Đưa "${item.name}" lên`}
          aria-disabled={busy || undefined}
          disabled={index === 0}
          onClick={guard(() => onChange({ type: "move", id: item.id, direction: "up" }))}
        >
          <ArrowUp aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={`Đưa "${item.name}" xuống`}
          aria-disabled={busy || undefined}
          disabled={index === count - 1}
          onClick={guard(() => onChange({ type: "move", id: item.id, direction: "down" }))}
        >
          <ArrowDown aria-hidden />
        </Button>
      </div>
    </li>
  );
}

function Group({
  title,
  items,
  busy,
  onChange,
}: {
  title: string;
  items: BioCmsItem[];
  busy: boolean;
  onChange: (change: Change) => void;
}) {
  return (
    <section aria-label={title} className="space-y-space-xs">
      <h3 className="text-label-md text-on-surface-variant">
        {title} ({items.length})
      </h3>
      <ul className="divide-y">
        {items.map((item, i) => (
          <Row key={item.id} item={item} index={i} count={items.length} busy={busy} onChange={onChange} />
        ))}
      </ul>
    </section>
  );
}

// BioProductList (UX-DR49, FR-31): mọi Sản phẩm đang hiện trên website (Sản phẩm ẩn không có). Mỗi dòng ảnh 40px,
// tên, Switch "Hiện trên bio", nút Ghim, lên/xuống trong nhóm; nhóm "Đang ghim" ở trên, ngăn hairline. Mỗi thao tác
// lưu ngay + Toast "Đã lưu".
export function BioProductList({ pinned, rest }: Lists) {
  const router = useRouter();
  const [lists, apply] = useOptimistic({ pinned, rest }, applyChange);
  const [pending, startTransition] = useTransition();
  const [announcement, setAnnouncement] = useState("");

  const onChange = (change: Change) => {
    startTransition(async () => {
      apply(change);
      const call = (): Promise<Result> =>
        change.type === "visible"
          ? setBioItemVisible({ productId: change.id, visible: change.visible })
          : change.type === "pin"
            ? setBioItemPinned({ productId: change.id, pinned: change.pinned })
            : moveBioItem({ productId: change.id, direction: change.direction });
      const res = await callAction(call);
      if (res.ok) {
        toast.success("Đã lưu");
        setAnnouncement("Đã lưu");
      } else {
        toast.error(res.error);
      }
      router.refresh();
    });
  };

  if (lists.pinned.length + lists.rest.length === 0) {
    return <p className="text-body-sm text-on-surface-variant">Chưa có Sản phẩm đang hiện. Thêm Sản phẩm ở Kho trước.</p>;
  }
  return (
    <div className="divide-y rounded-xl border bg-card px-space-md">
      {lists.pinned.length > 0 && (
        <div className="py-space-sm">
          <Group title="Đang ghim" items={lists.pinned} busy={pending} onChange={onChange} />
        </div>
      )}
      {lists.rest.length > 0 && (
        <div className="py-space-sm">
          <Group title="Sản phẩm khác" items={lists.rest} busy={pending} onChange={onChange} />
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
