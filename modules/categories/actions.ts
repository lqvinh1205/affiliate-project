"use server";

import { updateTag } from "next/cache";
import type { z } from "zod";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import {
  categoryInputSchema,
  deleteCategoryInputSchema,
  moveCategoryInputSchema,
} from "@/modules/categories/schema";
import { deleteCategoryRecord, moveCategoryRecord, saveCategoryRecord } from "@/modules/categories/service";
import { CATEGORIES_TAG } from "@/modules/categories/tags";

export async function saveCategory(
  input: z.input<typeof categoryInputSchema>,
): Promise<Result<{ id: string; slug: string }>> {
  return run(async () => {
    const parsed = categoryInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await saveCategoryRecord(parsed.data);
    updateTag(CATEGORIES_TAG);
    return saved;
  });
}

export async function deleteCategory(input: z.input<typeof deleteCategoryInputSchema>): Promise<Result> {
  return run(async () => {
    const parsed = deleteCategoryInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    await deleteCategoryRecord(parsed.data);
    updateTag(CATEGORIES_TAG);
    return {};
  });
}

export async function moveCategory(input: z.input<typeof moveCategoryInputSchema>): Promise<Result> {
  return run(async () => {
    const parsed = moveCategoryInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    await moveCategoryRecord(parsed.data);
    updateTag(CATEGORIES_TAG);
    return {};
  });
}
