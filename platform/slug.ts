// Đường dẫn gốc đã dành cho hệ thống (spine AD-20): slug Danh mục không được trùng, vì Danh mục
// nằm ở `/[danh-muc]` cùng cấp các route này. Thêm thư mục tĩnh ở gốc `app/(site)` thì thêm vào đây
// (test `platform/slug.test.ts` so danh sách với thư mục thật).
export const RESERVED_ROOT_SLUGS: readonly string[] = [
  "cms",
  "api",
  "bai-viet",
  "bio",
  "tim-kiem",
  "meo-vat",
  "gom-link",
  "trang",
];

// "Mẹo vặt Đẹp" → "meo-vat-dep"
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
