import Link from "next/link";
import { listHref, type PostListFilters } from "@/app/cms/bai-viet/_components/post-list-params";

const SORT_TABS: { label: string; byViews: boolean }[] = [
  { label: "Sửa gần nhất", byViews: false },
  { label: "Lượt xem nhiều nhất", byViews: true },
];

// Sắp xếp danh sách Bài web trên URL (`?sap-xep=luot-xem` — FR-38, UX-DR71), giữ bộ lọc và từ khoá, về trang 1.
export function PostSortTabs({ filters }: { filters: PostListFilters }) {
  return (
    <nav aria-label="Sắp xếp" className="flex flex-wrap items-center gap-space-sm">
      <span className="text-label-md text-on-surface-variant">Sắp xếp</span>
      <ul className="flex flex-wrap gap-space-sm">
        {SORT_TABS.map((t) => {
          const active = t.byViews === filters.byViews;
          return (
            <li key={t.label}>
              <Link
                href={listHref({ ...filters, byViews: t.byViews })}
                aria-current={active ? "page" : undefined}
                // Ghép chuỗi thường: `cn` bỏ mất `text-label-md` khi gặp `text-<màu>` ([NO-25]).
                className={`inline-flex min-h-touch-target items-center rounded-full border px-space-md text-label-md ${
                  active ? "border-primary bg-primary-fixed text-on-primary-fixed" : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
