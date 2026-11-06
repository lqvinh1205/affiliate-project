"use server";

import { updateTag } from "next/cache";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import {
  inspirationInputSchema,
  setInspirationStatusInputSchema,
  type InspirationFormValues,
  type SetInspirationStatusInput,
} from "@/modules/inspirations/schema";
import { saveInspirationRecord, setInspirationStatusRecord } from "@/modules/inspirations/service";
import { INSPIRATIONS_TAG } from "@/modules/inspirations/tags";

// Kho Cảm hứng chỉ hiện trong CMS (không có query public); vẫn làm mới tag của miền theo AD-6.

export async function saveInspiration(input: InspirationFormValues): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = inspirationInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await saveInspirationRecord(parsed.data);
    updateTag(INSPIRATIONS_TAG);
    return saved;
  });
}

export async function setInspirationStatus(input: SetInspirationStatusInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = setInspirationStatusInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await setInspirationStatusRecord(parsed.data);
    updateTag(INSPIRATIONS_TAG);
    return saved;
  });
}
