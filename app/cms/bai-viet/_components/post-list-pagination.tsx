import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";
import { listHref, type PostListFilters } from "@/app/cms/bai-viet/_components/post-list-params";

export function PostListPagination({ filters, page, pages }: { filters: PostListFilters; page: number; pages: number }) {
  if (pages <= 1) return null;
  const link = (target: number, label: string, Icon: typeof ChevronLeft, after = false) => (
    <Link
      href={listHref(filters, target)}
      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-touch-target lg:min-h-0")}
    >
      {!after && <Icon aria-hidden />}
      {label}
      {after && <Icon aria-hidden />}
    </Link>
  );
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-2">
      {page > 1 ? link(page - 1, "Trang trước", ChevronLeft) : <span />}
      <span className="text-body-sm text-on-surface-variant">
        Trang {page}/{pages}
      </span>
      {page < pages ? link(page + 1, "Trang sau", ChevronRight, true) : <span />}
    </nav>
  );
}

