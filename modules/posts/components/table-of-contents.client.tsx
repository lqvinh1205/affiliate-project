"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Heading } from "@/platform/html/content";

// Mục h2 đang đọc: h2 cuối cùng đã cuộn qua mép trên (chừa header dính).
function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(" ");
  useEffect(() => {
    const els = (key ? key.split(" ") : [])
      .map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    const update = () => {
      let current: string | null = null;
      for (const el of els) if (el.getBoundingClientRect().top <= 120) current = el.id;
      setActive(current ?? els[0].id);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [key]);
  return active;
}

// TableOfContents (UX-DR23, token `toc`): sinh từ h2 sau sanitize; < 2 h2 thì không render.
// *inline* (mobile, sau ảnh đầu bài): khối `<details>` mặc định mở, chạm tiêu đề để thu; mục đánh số.
// *sticky* (desktop, cột phải): mục đang đọc màu `primary`. Cuộn mượt theo `scroll-smooth` của `<html>` (tắt khi
// reduced-motion — globals.css); h2 có `scroll-margin-top` chừa header.
export function TableOfContents({ headings, variant }: { headings: Heading[]; variant: "inline" | "sticky" }) {
  const active = useActiveHeading(variant === "sticky" ? headings.map((h) => h.id) : []);
  if (headings.length < 2) return null;

  const list = (
    <ol className="space-y-1 text-body-regular">
      {headings.map((h, i) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            aria-current={active === h.id ? "location" : undefined}
            className={`flex min-h-touch-target items-center gap-space-sm rounded-lg py-1 hover:text-primary ${
              active === h.id ? "font-semibold text-primary" : "text-on-surface-variant"
            }`}
          >
            <span aria-hidden className="w-5 shrink-0 text-label-md">
              {i + 1}.
            </span>
            <span>{h.text}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === "sticky") {
    return (
      <nav aria-label="Mục lục" className="rounded-xl bg-surface-container-high p-space-md">
        <p className="mb-space-sm text-headline-sm">Mục lục</p>
        {list}
      </nav>
    );
  }
  return (
    <nav aria-label="Mục lục">
      <details open className="group rounded-xl bg-surface-container-high p-space-md">
        <summary className="flex min-h-touch-target cursor-pointer list-none items-center justify-between text-headline-sm [&::-webkit-details-marker]:hidden">
          Mục lục
          <ChevronDown className="size-5 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
        </summary>
        <div className="mt-space-sm">{list}</div>
      </details>
    </nav>
  );
}
