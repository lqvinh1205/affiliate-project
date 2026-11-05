import type { getProductForCms, listProductsForCms } from "@/modules/products/cms-queries";

export type ProductListItem = Awaited<ReturnType<typeof listProductsForCms>>["items"][number];
export type ProductForCms = NonNullable<Awaited<ReturnType<typeof getProductForCms>>>;
