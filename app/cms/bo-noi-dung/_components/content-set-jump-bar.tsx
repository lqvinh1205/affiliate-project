import type { VisibleSuggestionStatus } from "@/modules/suggestions/constants";
import { cn } from "@/components/ui/lib/utils";

// Chấm màu theo StatusBadge của phần chính mỗi nền tảng (UX-DR40, UX-DR75).
const DOT: Record<VisibleSuggestionStatus, string> = {
  GENERATING: "bg-outline",
  PENDING: "bg-tertiary",
  APPROVED: "bg-secondary",
  REJECTED: "bg-outline",
  FAILED: "bg-error",
};

export type JumpChip = { href: string; label: string; status: VisibleSuggestionStatus | null };

// Thanh nhảy của Bộ nội dung (UX-DR75): dính dưới thanh CmsShell, chip theo nền tảng có trong bộ, chạm cuộn tới khối
// (neo `#…`; cuộn mượt theo `scroll-behavior` toàn trang, tắt khi reduced-motion). Cuộn ngang có chủ đích, không hiện
// thanh cuộn.
export function ContentSetJumpBar({ chips }: { chips: JumpChip[] }) {
  if (chips.length === 0) return null;
  return (
    <nav
      aria-label="Nhảy tới nền tảng"
      className="sticky-bar sticky top-14 z-10 -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin py-space-sm [scrollbar-width:none] lg:top-0"
    >
      {chips.map((c) => (
        <a
          key={c.href}
          href={c.href}
          className="inline-flex min-h-touch-target shrink-0 snap-start items-center gap-2 rounded-full border px-space-md text-label-md hover:bg-surface-container"
        >
          <span aria-hidden className={cn("size-2 rounded-full", c.status ? DOT[c.status] : "bg-outline-variant")} />
          {c.label}
        </a>
      ))}
    </nav>
  );
}
