import type { getBioForCms } from "@/modules/bio/cms-queries";
import type { getBioPage } from "@/modules/bio/queries";

type BioPageItem = Awaited<ReturnType<typeof getBioPage>>["items"][number];
// Món trên `/bio` truyền xuống client component lọc chip: ngày là chuỗi ISO (AD-8).
export type BioProductView = Omit<BioPageItem, "priceUpdatedAt"> & { priceUpdatedAt: string | null };
export type BioCategoryView = Awaited<ReturnType<typeof getBioPage>>["categories"][number];

// Một dòng của BioProductList (`/cms/bio`).
export type BioCmsItem = Awaited<ReturnType<typeof getBioForCms>>["pinned"][number];
export type BioSettingsView = Awaited<ReturnType<typeof getBioForCms>>["settings"];
