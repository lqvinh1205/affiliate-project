import type { Prisma } from "@/generated/prisma/client";
import type { listPickerProductsForCms, listProductsForCms } from "@/modules/products/cms-queries";
import type { publicProductSelect } from "@/modules/products/queries";

export type ProductListItem = Awaited<ReturnType<typeof listProductsForCms>>["items"][number];
// Sản phẩm trên website: đúng các trường của `publicProductSelect`.
export type PublicProduct = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;
// Sản phẩm trong ProductPicker: trường public (để xem trước bài) + cờ `hidden`. Truyền xuống client component nên
// ngày là chuỗi ISO (AD-8); Screen đổi sang chuỗi, bản xem trước đổi lại `Date` cho ProductCard.
type PickerProductRow = Awaited<ReturnType<typeof listPickerProductsForCms>>[number];
export type PickerProduct = Omit<PickerProductRow, "priceUpdatedAt"> & { priceUpdatedAt: string | null };
