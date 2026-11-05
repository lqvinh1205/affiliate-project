import type { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";

// Một lựa chọn Danh mục trong form CMS (Sản phẩm, Bài web).
export type CategoryOption = Awaited<ReturnType<typeof listCategoryOptionsForCms>>[number];
