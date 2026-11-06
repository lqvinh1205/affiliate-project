"use client";

import { useState } from "react";
import type { PublicProduct } from "@/modules/products/types";
import { ProductCard } from "@/modules/products/components/product-card";
import { BIO_UNCATEGORIZED_LABEL } from "@/modules/bio/constants";
import type { BioCategoryView, BioProductView } from "@/modules/bio/types";
import { FilterChips } from "@/components/shared/filter-chips.client";

const ALL = "";

type Group = { key: string; title: string; items: BioProductView[] };

// Đổi ngày ISO về `Date` cho ProductCard (AD-8: qua ranh giới client là chuỗi).
function toProduct({ priceUpdatedAt, ...p }: BioProductView): PublicProduct {
  return { ...p, priceUpdatedAt: priceUpdatedAt ? new Date(priceUpdatedAt) : null };
}

// Chip "Tất cả" (UX-DR66 › 4a): nhóm "Nổi bật" (món ghim, theo thứ tự bio) rồi mỗi Danh mục một nhóm theo thứ tự hiển
// thị, món ghim không lặp; món chưa có Danh mục ở nhóm "Khác" cuối cùng.
function groupsOf(items: BioProductView[], categories: BioCategoryView[]): Group[] {
  const rest = items.filter((p) => !p.pinned);
  const groups: Group[] = [
    { key: "noi-bat", title: "Nổi bật", items: items.filter((p) => p.pinned) },
    ...categories.map((c) => ({ key: c.id, title: c.name, items: rest.filter((p) => p.categoryId === c.id) })),
    { key: "khac", title: BIO_UNCATEGORIZED_LABEL, items: rest.filter((p) => !p.categoryId) },
  ];
  return groups.filter((g) => g.items.length > 0);
}

function ProductList({ items }: { items: BioProductView[] }) {
  return (
    <ul className="space-y-space-sm">
      {items.map((p) => (
        <li key={p.id}>
          <ProductCard product={toProduct(p)} pinned={p.pinned} />
        </li>
      ))}
    </ul>
  );
}

// FilterChips + danh sách ProductCard *row* của `/bio` (FR-30, UX-DR30, UX-DR66). Lọc phía client tức thì, không đổi
// URL; HTML tĩnh là chế độ "Tất cả". Chip gồm "Tất cả" và mỗi Danh mục có món (kèm số món, tính cả món ghim).
export function BioBrowser({ items, categories }: { items: BioProductView[]; categories: BioCategoryView[] }) {
  const [selected, setSelected] = useState(ALL);
  const active = categories.some((c) => c.id === selected) ? selected : ALL;
  const chips = [
    { value: ALL, label: "Tất cả" },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
      count: items.filter((p) => p.categoryId === c.id).length,
    })),
  ];

  return (
    <div className="space-y-space-lg">
      {categories.length > 0 && (
        <FilterChips label="Lọc theo Danh mục" chips={chips} value={active} onChange={setSelected} />
      )}
      {active === ALL ? (
        groupsOf(items, categories).map((g) => (
          <section key={g.key} aria-labelledby={`bio-${g.key}`} className="space-y-space-sm">
            <h2 id={`bio-${g.key}`} className="flex items-baseline gap-space-sm text-headline-sm">
              {g.title}
              <span className="text-label-meta text-on-surface-variant tabular-nums">{g.items.length} món</span>
            </h2>
            <ProductList items={g.items} />
          </section>
        ))
      ) : (
        // Chip một Danh mục (4b): danh sách phẳng, món ghim lên đầu (thứ tự bio đã đặt ghim trước), giữ dấu Ghim.
        <section aria-label={categories.find((c) => c.id === active)?.name}>
          <ProductList items={items.filter((p) => p.categoryId === active)} />
        </section>
      )}
    </div>
  );
}
