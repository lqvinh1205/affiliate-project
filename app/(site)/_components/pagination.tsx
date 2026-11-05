import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageHref, paginationItems } from "@/app/(site)/_components/pagination-items";

// Ghép chuỗi thường, không qua `cn`: tailwind-merge coi `text-label-md` và `text-on-primary` cùng nhóm.
const CELL = "inline-flex min-h-touch-target min-w-touch-target items-center justify-center rounded-lg px-2 text-label-md";

// Pagination (UX-DR29): link tĩnh, "Trang trước/Trang sau" + số trang (đầu, cuối, ±1); một trang thì ẩn.
export function Pagination({ base, page, pages }: { base: string; page: number; pages: number }) {
  const items = paginationItems(page, pages);
  if (items.length === 0) return null;
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-center gap-space-xs">
      {page > 1 && (
        <Link href={pageHref(base, page - 1)} className={`${CELL} hover:bg-surface-container`}>
          <ChevronLeft className="size-4" aria-hidden />
          Trang trước
        </Link>
      )}
      <ul className="flex items-center gap-space-xs">
        {items.map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-on-surface-variant">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={pageHref(base, item)}
                aria-label={`Trang ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`${CELL} ${item === page ? "bg-primary text-on-primary" : "hover:bg-surface-container"}`}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ul>
      {page < pages && (
        <Link href={pageHref(base, page + 1)} className={`${CELL} hover:bg-surface-container`}>
          Trang sau
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
