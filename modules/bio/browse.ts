import { BIO_UNCATEGORIZED_LABEL } from "@/modules/bio/constants";

// Dòng Danh mục và nhóm của `/bio` (UX-DR66, Vinh 2026-11-06) — hàm thuần cho `BioBrowser`, test đơn vị ở
// `browse.test.ts`. `items` đã theo thứ tự bio (món ghim trước), `categories` theo thứ tự hiển thị.

type Item = { pinned: boolean; categoryId: string | null };
type Category = { id: string; name: string; slug: string; description: string | null };

// Tham số URL giữ dòng Danh mục đang xem (`/bio?danh-muc=<slug>`): quay lại / tải lại vẫn đúng màn.
export const BIO_CATEGORY_PARAM = "danh-muc";
// Dòng "Khác" (món chưa có Danh mục). Slug Danh mục không chứa "_" (`slugField`) nên không trùng.
export const BIO_UNCATEGORIZED_KEY = "_khac";

export type BioCategoryRow = { key: string; name: string; description: string | null; count: number };

// Nhóm theo Danh mục: "Nổi bật" (món ghim) rồi mỗi Danh mục một nhóm theo thứ tự hiển thị, món ghim không lặp; món
// chưa có Danh mục ở nhóm "Khác" cuối cùng. Bỏ nhóm rỗng.
export function bioGroupsOf<T extends Item>(items: T[], categories: Category[]) {
  const rest = items.filter((p) => !p.pinned);
  const groups = [
    { key: "noi-bat", title: "Nổi bật", items: items.filter((p) => p.pinned) },
    ...categories.map((c) => ({ key: c.id, title: c.name, items: rest.filter((p) => p.categoryId === c.id) })),
    { key: "khac", title: BIO_UNCATEGORIZED_LABEL, items: rest.filter((p) => !p.categoryId) },
  ];
  return groups.filter((g) => g.items.length > 0);
}

// Màn mặc định: có món ghim → chỉ nhóm "Nổi bật"; không có → mọi nhóm theo Danh mục.
export function bioDefaultGroupsOf<T extends Item>(items: T[], categories: Category[]) {
  const groups = bioGroupsOf(items, categories);
  return groups[0]?.key === "noi-bat" ? groups.slice(0, 1) : groups;
}

// Mỗi Danh mục có món một dòng (số món tính cả món ghim — khớp danh sách khi mở dòng), rồi dòng "Khác" nếu có món
// chưa có Danh mục.
export function bioCategoryRowsOf(items: Item[], categories: Category[]): BioCategoryRow[] {
  const rows = categories.map((c) => ({
    key: c.slug,
    name: c.name,
    description: c.description,
    count: items.filter((p) => p.categoryId === c.id).length,
  }));
  const other = items.filter((p) => !p.categoryId).length;
  if (other > 0) rows.push({ key: BIO_UNCATEGORIZED_KEY, name: BIO_UNCATEGORIZED_LABEL, description: null, count: other });
  return rows.filter((r) => r.count > 0);
}

// Món của một dòng Danh mục: danh sách phẳng giữ thứ tự bio (món ghim lên đầu, vẫn mang `pinned` để hiện dấu Ghim).
// `key` không khớp dòng nào (URL cũ, Danh mục đã đổi slug) → null, màn về mặc định.
export function bioItemsOfRow<T extends Item>(items: T[], categories: Category[], key: string) {
  if (key === BIO_UNCATEGORIZED_KEY) {
    const list = items.filter((p) => !p.categoryId);
    return list.length > 0 ? list : null;
  }
  const category = categories.find((c) => c.slug === key);
  if (!category) return null;
  const list = items.filter((p) => p.categoryId === category.id);
  return list.length > 0 ? list : null;
}
