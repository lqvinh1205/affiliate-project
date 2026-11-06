import { BIO_UNCATEGORIZED_LABEL } from "@/modules/bio/constants";

// Nhóm và chip của `/bio` (UX-DR66) — hàm thuần cho `BioBrowser`, test đơn vị ở `browse.test.ts`. `items` đã theo thứ
// tự bio (món ghim trước), `categories` theo thứ tự hiển thị.

type Item = { pinned: boolean; categoryId: string | null };
type Category = { id: string; name: string };

export const BIO_ALL_CHIP = "";

// Chip "Tất cả" (4a): nhóm "Nổi bật" (món ghim, theo thứ tự bio) rồi mỗi Danh mục một nhóm theo thứ tự hiển thị, món
// ghim không lặp; món chưa có Danh mục ở nhóm "Khác" cuối cùng. Bỏ nhóm rỗng.
export function bioGroupsOf<T extends Item>(items: T[], categories: Category[]) {
  const rest = items.filter((p) => !p.pinned);
  const groups = [
    { key: "noi-bat", title: "Nổi bật", items: items.filter((p) => p.pinned) },
    ...categories.map((c) => ({ key: c.id, title: c.name, items: rest.filter((p) => p.categoryId === c.id) })),
    { key: "khac", title: BIO_UNCATEGORIZED_LABEL, items: rest.filter((p) => !p.categoryId) },
  ];
  return groups.filter((g) => g.items.length > 0);
}

// Chip "Tất cả" (không số) rồi mỗi Danh mục kèm số món (tính cả món ghim — khớp danh sách phẳng khi chọn chip).
export function bioChipsOf(items: Item[], categories: Category[]) {
  return [
    { value: BIO_ALL_CHIP, label: "Tất cả" },
    ...categories.map((c) => ({ value: c.id, label: c.name, count: items.filter((p) => p.categoryId === c.id).length })),
  ];
}

// Chip một Danh mục (4b): danh sách phẳng giữ thứ tự bio (món ghim lên đầu, vẫn mang `pinned` để hiện dấu Ghim).
export function bioItemsOfCategory<T extends Item>(items: T[], categoryId: string) {
  return items.filter((p) => p.categoryId === categoryId);
}
