import Link from "next/link";
import { ChevronLeft, ChevronRight, FileVideo, ImageIcon, Link2 } from "lucide-react";
import { formatShortDate } from "@/platform/format";
import { first, pageParam } from "@/platform/search-params";
import { listInspirationsForCms } from "@/modules/content-sets/cms-queries";
import type { InspirationListItem } from "@/modules/content-sets/types";
import {
  INSPIRATION_FILTER_PARAM,
  INSPIRATION_FILTERS,
  INSPIRATION_PAGE_SIZE,
  INSPIRATION_STATUS_LABEL,
  inspirationFilterOf,
  type InspirationDisplayStatus,
} from "@/modules/inspirations/constants";
import { InspirationStatusBadge } from "@/modules/inspirations/components/inspiration-status-badge";
import { CHIP_ACTIVE, CHIP_BASE, CHIP_IDLE, CHIP_ROW } from "@/components/shared/chip-styles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";
import { InspirationCreateSheet } from "@/app/cms/cam-hung/_components/inspiration-create-sheet.client";

const LIST_PATH = "/cms/cam-hung";

const EMPTY_TEXT: Record<InspirationDisplayStatus, string> = {
  NEW: "Chưa có Cảm hứng mới. Chạm “Lưu cảm hứng”, dán link video là xong.",
  USED: "Chưa có Cảm hứng nào đã thành Bộ nội dung.",
  SKIPPED: "Không có Cảm hứng nào bị bỏ qua.",
};

function href(filter: string, page = 1) {
  const params = new URLSearchParams();
  if (filter !== INSPIRATION_FILTERS[0].value) params.set(INSPIRATION_FILTER_PARAM, filter);
  if (page > 1) params.set("trang", String(page));
  const s = params.toString();
  return s ? `${LIST_PATH}?${s}` : LIST_PATH;
}

function SourceIcon({ item }: { item: InspirationListItem }) {
  const Icon = item.url ? Link2 : item.mediaKind === "video" ? FileVideo : ImageIcon;
  return <Icon className="size-4 shrink-0" aria-hidden />;
}

// Meta một dòng: nguồn (host link · có file) và ngày lưu.
function meta(item: InspirationListItem) {
  const parts: string[] = [];
  if (item.url && item.hasNote) {
    try {
      parts.push(new URL(item.url).hostname.replace(/^www\./, ""));
    } catch {
      parts.push("Link");
    }
  }
  if (item.mediaKind) parts.push(item.mediaKind === "video" ? "Có video" : "Có ảnh");
  parts.push(`Lưu ${formatShortDate(new Date(item.createdAt))}`);
  return parts.join(" · ");
}

// Danh sách Cảm hứng `/cms/cam-hung` (UX-DR76): "Lưu cảm hứng" tạo nhanh, chip lọc Mới / Đã dùng / Bỏ qua qua
// `?trang-thai=` (mặc định Mới), mới nhất trước, phân trang `?trang`. *Đã dùng* suy ra từ Bộ nội dung (query ở
// `content-sets` — AD-2).
export async function InspirationListScreen({ searchParams }: Pick<PageProps<"/cms/cam-hung">, "searchParams">) {
  const params = await searchParams;
  const filter = inspirationFilterOf(first(params[INSPIRATION_FILTER_PARAM]));
  const { items, total, page, counts } = await listInspirationsForCms({
    filter: filter.status,
    page: pageParam(first(params.trang)),
  });
  const pages = Math.ceil(total / INSPIRATION_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-space-md">
      <h1 className="text-headline-lg-mobile lg:text-headline-lg">Cảm hứng</h1>
      {/* Mobile: nút tạo dính đáy (sau danh sách); desktop: ngay dưới tiêu đề. */}
      <div className="sticky-bar sticky bottom-0 z-20 order-last -mx-margin border-t px-margin pt-space-sm pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-sticky-bottom lg:static lg:order-none lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
        <InspirationCreateSheet />
      </div>

      <nav aria-label="Lọc Cảm hứng theo trạng thái" className={CHIP_ROW}>
        {INSPIRATION_FILTERS.map((f) => {
          const active = f.value === filter.value;
          return (
            <Link
              key={f.value}
              href={href(f.value)}
              aria-current={active ? "page" : undefined}
              className={`${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              {INSPIRATION_STATUS_LABEL[f.status]}
              <span className="tabular-nums">
                <span aria-hidden>·</span> {counts[f.status]}
              </span>
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <p className="rounded-xl border p-space-lg text-center text-on-surface-variant">{EMPTY_TEXT[filter.status]}</p>
      ) : (
        <>
          <ul className="space-y-space-sm">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`${LIST_PATH}/${item.id}`}
                  className="block space-y-1 rounded-xl border bg-card p-space-md hover:bg-surface-container"
                >
                  <span className="flex items-start justify-between gap-space-sm">
                    <span className="flex min-w-0 items-center gap-space-sm text-headline-sm">
                      <SourceIcon item={item} />
                      <span className="min-w-0 break-words">{item.label}</span>
                    </span>
                    <InspirationStatusBadge status={item.status} />
                  </span>
                  <span className="block text-body-sm text-on-surface-variant">{meta(item)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <nav aria-label="Phân trang" className="flex items-center justify-between gap-2">
              {page > 1 ? (
                <Link href={href(filter.value, page - 1)} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-touch-target lg:min-h-0")}>
                  <ChevronLeft aria-hidden /> Trang trước
                </Link>
              ) : (
                <span />
              )}
              <span className="text-body-sm text-on-surface-variant">
                Trang {page}/{pages}
              </span>
              {page < pages ? (
                <Link href={href(filter.value, page + 1)} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-touch-target lg:min-h-0")}>
                  Trang sau <ChevronRight aria-hidden />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
