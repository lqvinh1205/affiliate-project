export type CategoryKey = "MEO_VAT" | "GOM_LINK";

export const CATEGORIES: Record<
  CategoryKey,
  { label: string; slug: string; description: string }
> = {
  MEO_VAT: {
    label: "Mẹo vặt",
    slug: "meo-vat",
    description: "Mẹo nhà cửa, bếp núc, giặt giũ và chăm sóc bản thân.",
  },
  GOM_LINK: {
    label: "Gom link",
    slug: "gom-link",
    description: "Tổng hợp đồ xinh, đồ tiện ích giá tốt đã được chọn lọc.",
  },
};

export function categoryFromSlug(slug: string): CategoryKey | null {
  const entry = Object.entries(CATEGORIES).find(([, c]) => c.slug === slug);
  return entry ? (entry[0] as CategoryKey) : null;
}
