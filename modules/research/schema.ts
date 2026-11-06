import { z } from "zod";
import { researchProfileSchema } from "@/modules/research/prompts/research-product.prompt";

// Sửa Hồ sơ nghiên cứu đã Duyệt (`saveResearchProfile`, FR-22): sửa không đổi trạng thái gợi ý (AD-19).
export const saveResearchProfileInputSchema = z.object({
  productId: z.string().min(1, "Thiếu Sản phẩm"),
  data: researchProfileSchema,
});

// Giá trị form Hồ sơ nghiên cứu (dùng cho cả Duyệt gợi ý `RESEARCH` và sửa sau Duyệt).
export type ResearchProfileFormValues = z.input<typeof researchProfileSchema>;
export type SaveResearchProfileInput = z.input<typeof saveResearchProfileInputSchema>;
