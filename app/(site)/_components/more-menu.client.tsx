"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { NavCategory } from "@/modules/posts/types";

// Menu "Thêm" của nav desktop: Danh mục không vừa nav ngang. Đóng khi đổi trang, Esc (trả focus về nút),
// hoặc chạm ra ngoài.
export function MoreMenu({ categories, linkClassName }: { categories: NavCategory[]; linkClassName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Đổi trang (điều hướng phía client) thì đóng menu.
  if (open && openedAt !== pathname) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="nav-more"
        onClick={() => {
          setOpenedAt(pathname);
          setOpen((o) => !o);
        }}
        className={`${linkClassName} gap-1`}
      >
        Thêm
        <ChevronDown
          className={`size-4 transition motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          id="nav-more"
          className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-xl border bg-surface-container-lowest p-space-xs shadow-level-1"
        >
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/${c.slug}`} onClick={() => setOpen(false)} className={`${linkClassName} w-full px-space-sm`}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
