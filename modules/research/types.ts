import type { getResearchProfileForCms } from "@/modules/research/cms-queries";

export type { ResearchProfileData } from "@/modules/research/prompts/research-product.prompt";

// Hồ sơ nghiên cứu đã Duyệt của một Sản phẩm, như màn CMS đọc.
export type ResearchProfileForCms = NonNullable<Awaited<ReturnType<typeof getResearchProfileForCms>>>;
