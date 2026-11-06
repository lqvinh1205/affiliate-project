import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

// Đầu màn tạo/sửa: link về danh sách + tiêu đề (+ StatusBadge khi sửa).
export function BannerScreenHeader({ title, badge }: { title: string; badge?: ReactNode }) {
  return (
    <header className="mb-space-lg space-y-space-xs">
      <Link
        href="/cms/banner"
        className="-ml-2 inline-flex min-h-touch-target items-center gap-1 rounded-lg px-2 text-label-md text-on-surface-variant hover:text-on-surface"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Banner
      </Link>
      <div className="flex flex-wrap items-center gap-space-sm">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg">{title}</h1>
        {badge}
      </div>
    </header>
  );
}
