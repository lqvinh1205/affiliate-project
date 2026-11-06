"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { ask } from "@/platform/ai/ask";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import { listCategoryOptionsForCms } from "@/modules/categories/cms-queries";
import { getProductForCms } from "@/modules/products/cms-queries";
import { setProductCategoryRecord } from "@/modules/products/service";
import { PRODUCTS_TAG } from "@/modules/products/tags";
import {
  productCategoryPayloadSchema,
  researchProductPrompt,
  researchProfileSchema,
  toResearchPayloads,
} from "@/modules/research/prompts/research-product.prompt";
import { upsertResearchProfileRecord } from "@/modules/research/service";
import { RESEARCH_TAG } from "@/modules/research/tags";
import { GENERATING_TIMEOUT_MS, RESEARCH_FAILED } from "@/modules/suggestions/constants";
import {
  approveSuggestionInputSchema,
  rejectSuggestionInputSchema,
  researchProductInputSchema,
  type ApproveSuggestionInput,
  type RejectSuggestionInput,
  type ResearchProductInput,
} from "@/modules/suggestions/schema";
import {
  approveSuggestionRecord,
  completeResearchRecords,
  failSuggestionsRecord,
  rejectSuggestionRecord,
  startResearchRecords,
} from "@/modules/suggestions/service";

// Điểm điều phối duy nhất cho tạo và Duyệt Gợi ý AI (spine AD-9). Tạo: ghi `GENERATING`, trả về ngay, gọi AI trong
// `after()` (AD-18); callback chỉ ghi `Suggestion` (CMS, không cache) nên không `updateTag`. Duyệt: một transaction
// upsert vào đích rồi `updateTag` tag của module đích.

type Product = NonNullable<Awaited<ReturnType<typeof getProductForCms>>>;

const PRODUCT_NOT_FOUND = "Không tìm thấy Sản phẩm. Có thể đã bị xoá.";

// Nghiên cứu Sản phẩm (FR-6..FR-11): một lần gọi AI có tìm web và đọc ảnh, ghi thành hai gợi ý `RESEARCH`
// và `PRODUCT_CATEGORY`. Dùng cho cả lần đầu và Tạo lại kèm chỉ dẫn (FR-21): Tạo lại thay cả hai gợi ý đang chờ.
export async function researchProduct(input: ResearchProductInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = researchProductInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { productId, instruction } = parsed.data;
    const product = await getProductForCms(productId);
    if (!product) throw new UserError(PRODUCT_NOT_FOUND);
    const ids = await startResearchRecords({
      productId,
      promptId: researchProductPrompt.id,
      promptVersion: researchProductPrompt.version,
      staleBefore: new Date(Date.now() - GENERATING_TIMEOUT_MS),
    });
    after(() => runResearch(product, instruction, ids));
    return { id: ids.researchId };
  });
}

// Chạy trong `after()`: không có `run()` bao ngoài nên tự ghi `FAILED` khi lỗi. `UserError` (vd mọi nhà AI lỗi) giữ
// thông báo của nó; lỗi bất ngờ ghi thông báo chung rồi ném tiếp để Next ghi log.
async function runResearch(product: Product, instruction: string | null, ids: { researchId: string; categoryId: string }) {
  try {
    const categories = await listCategoryOptionsForCms();
    const images = [...new Set([product.image, ...product.rawImageUrls].filter((u): u is string => !!u))];
    const res = await ask({
      prompt: researchProductPrompt,
      input: {
        name: product.name,
        priceText: product.priceText,
        affiliateUrl: product.affiliateUrl,
        rawText: product.rawText,
        rawReviews: product.rawReviews,
        imageCount: images.length,
        categories: categories.map((c) => ({ id: c.id, name: c.name })),
        instruction,
      },
      images,
      webSearch: true,
    });
    const { profile, category } = toResearchPayloads(res.data, {
      hasReviews: !!product.rawReviews?.trim(),
      hasImages: images.length > 0 && !res.skipped.includes("images"),
      categories,
    });
    await completeResearchRecords({ ...ids, profile, category, sources: res.sources ?? [], skipped: res.skipped });
  } catch (e) {
    const message = e instanceof UserError ? `Chưa nghiên cứu được Sản phẩm. ${e.message}` : RESEARCH_FAILED;
    await failSuggestionsRecord({ ids: [ids.researchId, ids.categoryId], message });
    if (!(e instanceof UserError)) throw e;
  }
}

// Duyệt (FR-22, AD-19): `RESEARCH` → upsert `ResearchProfile` theo Sản phẩm, ghi `editedBeforeApproval` khi nội dung
// gửi lên khác bản AI; `PRODUCT_CATEGORY` → `Product.categoryId`.
export async function approveSuggestion(input: ApproveSuggestionInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = approveSuggestionInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { id, payload } = parsed.data;
    const approved = await approveSuggestionRecord(id, async (s, tx) => {
      if (!s.productId) throw new UserError("Gợi ý không gắn Sản phẩm nào.");
      if (s.kind === "RESEARCH") {
        const original = researchProfileSchema.parse(s.payload);
        let data = original;
        if (payload !== undefined) {
          const edited = researchProfileSchema.safeParse(payload);
          if (!edited.success) throw new UserError(firstError(edited.error));
          data = edited.data;
        }
        await upsertResearchProfileRecord({ productId: s.productId, data }, tx);
        return { edited: JSON.stringify(data) !== JSON.stringify(original) };
      }
      const { categoryId } = productCategoryPayloadSchema.parse(s.payload);
      await setProductCategoryRecord({ id: s.productId, categoryId }, tx);
      return { edited: false };
    });
    // Hồ sơ chỉ hiện trong CMS (tag `research`); Danh mục của Sản phẩm đổi chip/điều hướng site (tag `products`, AD-7).
    updateTag(approved.kind === "RESEARCH" ? RESEARCH_TAG : PRODUCTS_TAG);
    return { id: approved.id };
  });
}

// Từ chối (FR-22): thẻ thu còn đầu thẻ + "Tạo lại" (UX-DR41). Chỉ đổi `Suggestion` (CMS, không cache).
export async function rejectSuggestion(input: RejectSuggestionInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = rejectSuggestionInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    return rejectSuggestionRecord(parsed.data);
  });
}
