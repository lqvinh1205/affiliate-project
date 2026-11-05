"use client";

import Link from "next/link";
import { useRef, useState, type ReactElement } from "react";
import { X } from "lucide-react";
import type { NavCategory } from "@/modules/posts/types";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Vuốt xuống quá ngưỡng này (px) trên Sheet thì đóng.
const SWIPE_CLOSE = 80;

// CategorySheet (UX-DR13): Sheet đáy liệt kê Danh mục có ≥ 1 Bài web đã xuất bản theo thứ tự hiển thị.
// Đóng bằng vuốt xuống (chỉ khi danh sách đang ở đầu, để vuốt cuộn danh sách không đóng Sheet), Esc, chạm nền;
// Sheet (base-ui Dialog) bẫy focus và trả focus về nút mở. `trigger(open)` dựng nút mở theo trạng thái.
export function CategorySheet({
  categories,
  trigger,
}: {
  categories: NavCategory[];
  trigger: (open: boolean) => ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const startY = useRef<number | null>(null);
  const list = useRef<HTMLElement>(null);
  const atTop = () => (list.current?.scrollTop ?? 0) <= 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger(open)} />
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[80dvh] gap-0 rounded-t-xl bg-surface-container-lowest pb-[env(safe-area-inset-bottom)]"
        onTouchStart={(e) => {
          startY.current = atTop() ? e.touches[0].clientY : null;
        }}
        onTouchEnd={(e) => {
          const swiped = startY.current !== null && e.changedTouches[0].clientY - startY.current > SWIPE_CLOSE;
          if (swiped && atTop()) setOpen(false);
          startY.current = null;
        }}
      >
        <div aria-hidden className="mx-auto mt-space-sm h-1 w-10 rounded-full bg-outline-variant" />
        <div className="flex items-center justify-between px-margin">
          <SheetTitle className="text-headline-md">Danh mục</SheetTitle>
          <SheetClose
            aria-label="Đóng"
            className="inline-flex size-touch-target items-center justify-center rounded-full hover:bg-surface-container"
          >
            <X className="size-5" aria-hidden />
          </SheetClose>
        </div>
        <nav ref={list} aria-label="Danh mục" className="overflow-y-auto px-margin pb-space-md">
          {categories.length === 0 ? (
            <p className="py-space-md text-body-sm text-on-surface-variant">Chưa có Danh mục nào có bài.</p>
          ) : (
            <ul className="divide-y">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-touch-target items-center text-body-regular hover:text-primary"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
