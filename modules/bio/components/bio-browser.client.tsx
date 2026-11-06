"use client";

import { useState } from "react";
import type { PublicProduct } from "@/modules/products/types";
import { ProductCard } from "@/modules/products/components/product-card";
import { BIO_ALL_CHIP, bioChipsOf, bioGroupsOf, bioItemsOfCategory } from "@/modules/bio/browse";
import type { BioCategoryView, BioProductView } from "@/modules/bio/types";
import { FilterChips } from "@/components/shared/filter-chips.client";

// Đổi ngày ISO về `Date` cho ProductCard (AD-8: qua ranh giới client là chuỗi).
function toProduct({ priceUpdatedAt, ...p }: BioProductView): PublicProduct {
  return { ...p, priceUpdatedAt: priceUpdatedAt ? new Date(priceUpdatedAt) : null };
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
  const [selected, setSelected] = useState(BIO_ALL_CHIP);
  const active = categories.some((c) => c.id === selected) ? selected : BIO_ALL_CHIP;
  const chips = bioChipsOf(items, categories);

  return (
    <div className="space-y-space-lg">
      {categories.length > 0 && (
        <FilterChips label="Lọc theo Danh mục" chips={chips} value={active} onChange={setSelected} />
      )}
      {active === BIO_ALL_CHIP ? (
        bioGroupsOf(items, categories).map((g) => (
          <section key={g.key} aria-labelledby={`bio-${g.key}`} className="space-y-space-sm">
            <h2 id={`bio-${g.key}`} className="flex items-baseline gap-space-sm text-headline-sm">
              {g.title}
              <span className="text-label-meta text-on-surface-variant tabular-nums">{g.items.length} món</span>
            </h2>
            <ProductList items={g.items} />
          </section>
        ))
      ) : (
        <section aria-label={categories.find((c) => c.id === active)?.name}>
          <ProductList items={bioItemsOfCategory(items, active)} />
        </section>
      )}
    </div>
  );
}
