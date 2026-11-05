import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Đầu màn tạo/sửa: link về danh sách + tiêu đề.
export function CategoryScreenHeader({ title }: { title: string }) {
  return (
    <header className="mb-space-lg space-y-space-xs">
      <Link
        href="/cms/danh-muc"
        className="-ml-2 inline-flex min-h-touch-target items-center gap-1 rounded-lg px-2 text-label-md text-on-surface-variant hover:text-on-surface"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Danh mục
      </Link>
      <h1 className="text-headline-lg-mobile lg:text-headline-lg">{title}</h1>
    </header>
  );
}
