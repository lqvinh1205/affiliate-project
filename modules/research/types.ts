import type { getInspirationResearchForCms, getResearchProfileForCms } from "@/modules/research/cms-queries";

export type { ResearchProfileData } from "@/modules/research/prompts/research-product.prompt";
export type { InspirationResearchData } from "@/modules/research/prompts/research-inspiration.prompt";

// Hồ sơ nghiên cứu đã Duyệt của một Sản phẩm, như màn CMS đọc.
export type ResearchProfileForCms = NonNullable<Awaited<ReturnType<typeof getResearchProfileForCms>>>;
// Hồ sơ nghiên cứu đã Duyệt của một Cảm hứng.
export type InspirationResearchForCms = NonNullable<Awaited<ReturnType<typeof getInspirationResearchForCms>>>;
