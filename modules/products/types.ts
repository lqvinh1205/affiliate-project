import type { Prisma } from "@/generated/prisma/client";
import type { listProductsForCms } from "@/modules/products/cms-queries";
import type { publicProductSelect } from "@/modules/products/queries";

export type ProductListItem = Awaited<ReturnType<typeof listProductsForCms>>["items"][number];
// Sản phẩm trên website: đúng các trường của `publicProductSelect`.
export type PublicProduct = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;
