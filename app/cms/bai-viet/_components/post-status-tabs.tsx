import Link from "next/link";
import type { PostStatusFilter } from "@/modules/posts/constants";
import { listHref, type PostListFilters } from "@/app/cms/bai-viet/_components/post-list-params";

const FILTER_TABS: { label: string; status: PostStatusFilter | null }[] = [
  { label: "Tất cả", status: null },
  { label: "Nháp", status: "nhap" },
  { label: "Đã xuất bản", status: "da-xuat-ban" },
];

// Lọc Nháp / Đã xuất bản trên URL (UX-DR71), giữ từ khoá tìm.
export function PostStatusTabs({ filters }: { filters: PostListFilters }) {
  return (
    <nav aria-label="Lọc theo trạng thái">
      <ul className="flex gap-space-sm">
        {FILTER_TABS.map((t) => {
          const active = t.status === filters.status;
          return (
            <li key={t.label}>
              <Link
                href={listHref({ ...filters, status: t.status })}
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

