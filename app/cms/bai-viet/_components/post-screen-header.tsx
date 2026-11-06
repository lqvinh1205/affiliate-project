import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const BACK = "-ml-2 inline-flex min-h-touch-target items-center gap-1 rounded-lg px-2 text-label-md hover:text-on-surface";

// Đầu màn tạo/sửa Bài web: link về danh sách (+ "← Bộ nội dung" khi bài thuộc một Bộ nội dung — UX-DR72), tiêu đề,
// thao tác phụ của màn (`actions`, vd "Tạo bài mạng xã hội").
export function PostScreenHeader({
  title,
  contentSetHref,
  actions,
}: {
  title: string;
  contentSetHref?: string | null;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-space-lg space-y-space-xs">
      <div className="flex flex-wrap gap-x-space-md">
        <Link href="/cms/bai-viet" className={`${BACK} text-on-surface-variant`}>
          <ChevronLeft className="size-4" aria-hidden />
          Bài web
        </Link>
        {contentSetHref && (
          <Link href={contentSetHref} className={`${BACK} text-primary`}>
            <ChevronLeft className="size-4" aria-hidden />
            Bộ nội dung
          </Link>
        )}
      </div>
      <h1 className="text-headline-lg-mobile lg:text-headline-lg">{title}</h1>
      {actions && <div className="pt-space-sm">{actions}</div>}
    </header>
  );
}
