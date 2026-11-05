"use server";

import { updateTag } from "next/cache";
import type { z } from "zod";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import {
  productInputSchema,
  setProductHiddenInputSchema,
  type ProductFormValues,
} from "@/modules/products/schema";
import { saveProductRecord, setProductHiddenRecord } from "@/modules/products/service";
import { PRODUCTS_TAG } from "@/modules/products/tags";

export async function saveProduct(input: ProductFormValues): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await saveProductRecord(parsed.data);
    // Trang bài public đọc Sản phẩm gắn cả tag `products` (AD-7).
    updateTag(PRODUCTS_TAG);
    return saved;
  });
}

export async function setProductHidden(
  input: z.input<typeof setProductHiddenInputSchema>,
): Promise<Result<{ id: string; hidden: boolean }>> {
  return run(async () => {
    const parsed = setProductHiddenInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await setProductHiddenRecord(parsed.data);
    // Mọi query public trả Sản phẩm gắn tag `products` (AD-7): Sản phẩm ẩn biến khỏi website ngay.
    updateTag(PRODUCTS_TAG);
    return saved;
  });
}
