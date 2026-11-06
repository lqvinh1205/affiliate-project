import "server-only";
import { db } from "@/platform/db";
import {
  productCategoryPayloadSchema,
  researchProfileSchema,
} from "@/modules/research/prompts/research-product.prompt";

// Hồ sơ nghiên cứu đã Duyệt của Sản phẩm (Chi tiết Sản phẩm). `data` là Json: parse lại (AD-15); hỏng thì coi như
// chưa có hồ sơ để màn hình không vỡ.
export async function getResearchProfileForCms(productId: string) {
  const row = await db.researchProfile.findUnique({
    where: { productId },
    select: { id: true, data: true, updatedAt: true },
  });
  if (!row) return null;
  const data = researchProfileSchema.safeParse(row.data);
  if (!data.success) {
    console.error(`[research] ResearchProfile ${row.id}: data sai schema`);
    return null;
  }
  return { id: row.id, data: data.data, updatedAt: row.updatedAt };
}

// Đọc payload Json của gợi ý `RESEARCH` / `PRODUCT_CATEGORY` (AD-15: đọc ra phải parse). Đặt ở đây để
// `suggestions/cms-queries.ts` dùng được Zod của miền chủ đích mà không import `prompts/` (AD-2 chỉ mở cho
// `suggestions/actions.ts`). Sai schema → null.
export function parseResearchPayload(payload: unknown) {
  const r = researchProfileSchema.safeParse(payload);
  return r.success ? r.data : null;
}

export function parseProductCategoryPayload(payload: unknown) {
  const r = productCategoryPayloadSchema.safeParse(payload);
  return r.success ? r.data : null;
}
