"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/components/ui/lib/utils";

// Dải Banner khi có ≥ 2 (UX-DR15, UX-DR85): cuộn ngang snap theo thẻ, không thanh cuộn, **không tự chạy**; chấm vị trí
// theo thẻ đang thấy, chạm chấm thì cuộn tới thẻ đó (cuộn mượt, tắt khi reduced-motion — UX-DR91). Trang không cuộn
// ngang: dải tràn ra lề bằng `-mx-margin` như dải "Gom link đồ xinh". Mobile chừa một mép thẻ sau để báo còn nữa.
export function BannerStrip({ slides, titles }: { slides: ReactNode[]; titles: string[] }) {
  const list = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const items = Array.from(root.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(items.indexOf(e.target as HTMLElement));
        }
      },
      { root, threshold: 0.6 },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const goTo = (i: number) => {
    const el = list.current?.children[i] as HTMLElement | undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "start" });
  };

  return (
    <div>
      <ul
        ref={list}
        className="-mx-margin flex snap-x snap-mandatory scroll-px-margin gap-gutter overflow-x-auto px-margin [scrollbar-width:none] lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <li key={i} className="w-[88%] shrink-0 snap-start lg:w-full">
            {slide}
          </li>
        ))}
      </ul>
      <div className="flex justify-center" role="group" aria-label="Chọn banner">
        {titles.map((title, i) => (
          <button
            key={i}
            type="button"
            className="group/dot flex size-touch-target items-center justify-center"
            aria-label={`Banner ${i + 1}/${titles.length}: ${title}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => goTo(i)}
          >
            <span
              aria-hidden
              className={cn(
                "block h-2 rounded-full transition-all motion-reduce:transition-none",
                i === active ? "w-5 bg-primary" : "w-2 bg-outline-variant group-hover/dot:bg-outline",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
