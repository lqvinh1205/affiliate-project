import type { ReactNode } from "react";

// Minh hoạ nét mảnh (tách trà + mầm cây) màu `primary`/`secondary` (DESIGN.md › EmptyState), trang trí.
function TeaSprout() {
  return (
    <svg viewBox="0 0 96 96" className="size-24" fill="none" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
      <path d="M20 52h44v8a20 20 0 0 1-20 20h-4a20 20 0 0 1-20-20z" className="stroke-primary" />
      <path d="M64 56h4a8 8 0 0 1 0 16h-6" className="stroke-primary" />
      <path d="M14 86h56" className="stroke-primary" />
      <path d="M42 52V30" className="stroke-brand-secondary" />
      <path d="M42 38c0-8 6-14 14-14 0 8-6 14-14 14z" className="stroke-brand-secondary" />
      <path d="M42 32c0-7-5-12-12-12 0 7 5 12 12 12z" className="stroke-brand-secondary" />
    </svg>
  );
}

// EmptyState (UX-DR33): minh hoạ, tiêu đề `headline-md`, một câu gợi ý, một hành động chính. Dùng ở 404, trang lỗi,
// Trang chủ chưa có bài. `titleAs` = h1 khi EmptyState là nội dung chính của trang (mỗi trang một h1 — UX-DR87).
export function EmptyState({
  title,
  description,
  titleAs: Title = "h2",
  children,
}: {
  title: string;
  description: string;
  titleAs?: "h1" | "h2";
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-space-md px-margin py-space-xl text-center">
      <TeaSprout />
      <Title className="text-headline-md">{title}</Title>
      <p className="text-body-regular text-on-surface-variant">{description}</p>
      {children && <div className="flex flex-wrap justify-center gap-space-sm">{children}</div>}
    </div>
  );
}
