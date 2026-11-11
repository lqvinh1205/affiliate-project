"use client";

import { Suspense, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { formatCount } from "@/platform/format";
import type { PublicProduct } from "@/modules/products/types";
import { ProductCard } from "@/modules/products/components/product-card";
import { BIO_CATEGORY_ROWS_VISIBLE } from "@/modules/bio/constants";
import {
  BIO_CATEGORY_PARAM,
  bioCategoryRowsOf,
  bioDefaultGroupsOf,
  bioItemsOfRow,
  bioOtherRowsOf,
  type BioCategoryRow,
} from "@/modules/bio/browse";
import type { BioCategoryView, BioProductView } from "@/modules/bio/types";

type BrowserProps = { items: BioProductView[]; categories: BioCategoryView[] };

// Đổi ngày ISO về `Date` cho ProductCard (AD-8: qua ranh giới client là chuỗi).
function toProduct({ priceUpdatedAt, ...p }: BioProductView): PublicProduct {
  return { ...p, priceUpdatedAt: priceUpdatedAt ? new Date(priceUpdatedAt) : null };
}

function ProductList({ items }: { items: BioProductView[] }) {
  return (
    <ul className="space-y-space-sm">
      {items.map((p) => (
        <li key={p.id}>
          <ProductCard product={toProduct(p)} variant="bio" pinned={p.pinned} />
        </li>
      ))}
    </ul>
  );
}

function CountPill({ count }: { count: number }) {
  return (
    <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 text-label-meta whitespace-nowrap text-on-surface-variant tabular-nums">
      {formatCount(count)} món
    </span>
  );
}

// Ô vuông đầu dòng Danh mục: chữ cái đầu tên (trang trí, thay emoji của Stitch — Vinh 2026-11-09).
function InitialMark({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-headline-sm text-on-primary-fixed"
    >
      {Array.from(name.trim().normalize("NFC"))[0]?.toLocaleUpperCase("vi")}
    </span>
  );
}

type Navigate = (e: MouseEvent<HTMLAnchorElement>) => void;

const rowHref = (key: string) => `/bio?${new URLSearchParams({ [BIO_CATEGORY_PARAM]: key })}`;

function CategoryRows({ rows, onNavigate }: { rows: BioCategoryRow[]; onNavigate: Navigate }) {
  const [expanded, setExpanded] = useState(false);
  // Thừa đúng 1 dòng thì hiện luôn, không cần nút "Xem thêm 1".
  const collapsible = rows.length > BIO_CATEGORY_ROWS_VISIBLE + 1;
  const shown = collapsible && !expanded ? rows.slice(0, BIO_CATEGORY_ROWS_VISIBLE) : rows;
  return (
    <section aria-labelledby="bio-danh-muc" className="space-y-space-sm">
      <div className="flex items-baseline justify-between gap-space-sm">
        <h2 id="bio-danh-muc" className="text-headline-sm">
          Danh mục
        </h2>
        <span className="text-label-meta text-on-surface-variant tabular-nums">{formatCount(rows.length)} danh mục</span>
      </div>
      <ul id="bio-danh-muc-list" className="space-y-space-sm">
        {shown.map((r) => (
          <li key={r.key}>
            <Link
              href={rowHref(r.key)}
              prefetch={false}
              onClick={onNavigate}
              className="group flex min-h-touch-target items-center gap-space-sm rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-md shadow-level-0 outline-offset-2 hover:border-primary/50 hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
            >
              <InitialMark name={r.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-headline-sm group-hover:text-primary">{r.name}</span>
                {r.description && (
                  <span className="block truncate text-body-sm text-on-surface-variant">{r.description}</span>
                )}
              </span>
              <CountPill count={r.count} />
              <ChevronRight className="size-5 shrink-0 text-on-surface-variant" strokeWidth={1.5} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="bio-danh-muc-list"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-touch-target w-full items-center justify-center gap-space-xs rounded-xl bg-surface-container-high text-label-md text-on-surface-variant outline-offset-2 hover:bg-surface-container-highest hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          {expanded ? "Thu gọn" : `Xem thêm ${formatCount(rows.length - BIO_CATEGORY_ROWS_VISIBLE)} danh mục`}
          <ChevronDown
            className={`size-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
      )}
    </section>
  );
}

// Cuối màn đã lọc (Stitch [DM-M], Vinh 2026-11-09): các dòng Danh mục khác dạng lưới 2 cột, link sang dòng đó.
function OtherCategories({ rows, onNavigate }: { rows: BioCategoryRow[]; onNavigate: Navigate }) {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="bio-danh-muc-khac" className="space-y-space-sm">
      <h2 id="bio-danh-muc-khac" className="text-headline-sm">
        Khám phá danh mục khác
      </h2>
      <ul className="grid grid-cols-2 gap-space-sm">
        {rows.map((r) => (
          <li key={r.key} className="flex">
            <Link
              href={rowHref(r.key)}
              prefetch={false}
              onClick={onNavigate}
              className="group flex w-full flex-col justify-between gap-space-md rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-md shadow-level-0 outline-offset-2 hover:border-primary/50 hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="min-w-0">
                <span className="block text-headline-sm group-hover:text-primary">{r.name}</span>
                {r.description && (
                  <span className="block truncate text-label-meta text-on-surface-variant">{r.description}</span>
                )}
              </span>
              <span className="flex items-center justify-between gap-space-xs text-label-meta text-on-surface-variant tabular-nums">
                {formatCount(r.count)} món
                <ArrowRight className="size-4 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Màn `/bio` theo `selected` (giá trị `?danh-muc=`; null/không khớp = mặc định).
function BioBrowserView({ items, categories, selected }: BrowserProps & { selected: string | null }) {
  const top = useRef<HTMLDivElement>(null);
  // Link đổi `?danh-muc=` bằng `history.pushState` (không tải lại, `useSearchParams` cập nhật theo) rồi đưa đầu khu duyệt
  // lên trên (không cuộn mượt). Vẫn là link thật nên mở tab mới / chưa có JS vẫn đúng.
  const onNavigate: Navigate = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.history.pushState(null, "", e.currentTarget.href);
    top.current?.scrollIntoView({ block: "start" });
  };
  const rows = bioCategoryRowsOf(items, categories);
  const row = selected ? rows.find((r) => r.key === selected) : undefined;
  const list = row ? bioItemsOfRow(items, categories, row.key) : null;
  const hasPinned = items.some((p) => p.pinned);

  if (row && list) {
    return (
      <div ref={top} className="scroll-mt-20 space-y-space-md">
        <Link
          href="/bio"
          prefetch={false}
          onClick={onNavigate}
          className="inline-flex min-h-touch-target items-center gap-space-xs text-label-md text-primary hover:underline"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
          {hasPinned ? "Về nổi bật" : "Tất cả danh mục"}
        </Link>
        <section aria-labelledby="bio-dang-xem" className="space-y-space-md">
          <div className="space-y-space-xs rounded-xl bg-surface-container-low p-space-md">
            <h2 id="bio-dang-xem" className="text-headline-lg-mobile">
              {row.name}
            </h2>
            {row.description && <p className="text-body-regular text-on-surface-variant">{row.description}</p>}
            <p className="text-label-meta text-on-surface-variant tabular-nums">{formatCount(list.length)} món</p>
          </div>
          <ProductList items={list} />
        </section>
        <OtherCategories rows={bioOtherRowsOf(rows, row.key)} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div ref={top} className="scroll-mt-20 space-y-space-lg">
      {rows.length > 0 && <CategoryRows rows={rows} onNavigate={onNavigate} />}
      {bioDefaultGroupsOf(items, categories).map((g) => (
        <section key={g.key} aria-labelledby={`bio-${g.key}`} className="space-y-space-sm">
          <h2 id={`bio-${g.key}`} className="flex items-baseline gap-space-sm text-headline-sm">
            {g.title}
            <span className="text-label-meta text-on-surface-variant tabular-nums">{formatCount(g.items.length)} món</span>
          </h2>
          <ProductList items={g.items} />
        </section>
      ))}
    </div>
  );
}

function BioBrowserFromUrl(props: BrowserProps) {
  const selected = useSearchParams().get(BIO_CATEGORY_PARAM);
  return <BioBrowserView {...props} selected={selected} />;
}

// Khu duyệt của `/bio` (FR-30, UX-DR66, Vinh 2026-11-06 theo Stitch): dòng Danh mục (chữ cái đầu, tên, mô tả 1 dòng,
// số món; nhiều thì "Xem thêm N danh mục") rồi nhóm "Nổi bật" (món ghim) — không có món ghim thì mọi nhóm theo Danh
// mục. Chạm một dòng → khối đầu Danh mục + chỉ món của Danh mục đó + "Về nổi bật" + "Khám phá danh mục khác". Dòng
// đang xem nằm trên URL (`?danh-muc=<slug>`) nên quay lại / tải lại giữ đúng màn; đọc phía client (`useSearchParams`
// trong `<Suspense>`) nên trang vẫn tĩnh (AD-7) — HTML tĩnh là màn mặc định.
export function BioBrowser(props: BrowserProps) {
  return (
    <Suspense fallback={<BioBrowserView {...props} selected={null} />}>
      <BioBrowserFromUrl {...props} />
    </Suspense>
  );
}
