import type { ReactNode } from "react";
import type { VisibleSuggestionStatus } from "@/modules/suggestions/constants";
import { SuggestionStatusBadge } from "@/modules/suggestions/components/suggestion-status-badge";

// SuggestionCard (UX-DR41): một thẻ = một Gợi ý AI. Đầu thẻ: tên phần (`headline-sm`) + StatusBadge; thân theo `kind`
// và trạng thái do nơi dùng truyền vào; chân thẻ (`footer`): mobile nút chính rộng hết thẻ, desktop căn phải.
export function SuggestionCard({
  title,
  status,
  headingId,
  children,
  footer,
}: {
  title: string;
  status: VisibleSuggestionStatus | null;
  headingId: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section aria-labelledby={headingId} className="rounded-xl border bg-card">
      <header className="flex min-h-touch-target items-center justify-between gap-space-sm px-space-md py-space-sm">
        <h2 id={headingId} className="text-headline-sm">
          {title}
        </h2>
        {status && <SuggestionStatusBadge status={status} />}
      </header>
      {children && <div className="space-y-space-md border-t px-space-md py-space-md">{children}</div>}
      {footer && <div className="border-t px-space-md py-space-sm">{footer}</div>}
    </section>
  );
}
