"use server";

import { updateTag } from "next/cache";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import {
  saveInspirationResearchInputSchema,
  saveResearchProfileInputSchema,
  type SaveInspirationResearchInput,
  type SaveResearchProfileInput,
} from "@/modules/research/schema";
import { saveInspirationResearchRecord, saveResearchProfileRecord } from "@/modules/research/service";
import { RESEARCH_TAG } from "@/modules/research/tags";

// Sửa Hồ sơ nghiên cứu sau Duyệt (FR-22, AD-19): không đổi trạng thái gợi ý, không cần Duyệt lại.
export async function saveResearchProfile(input: SaveResearchProfileInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = saveResearchProfileInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await saveResearchProfileRecord(parsed.data);
    updateTag(RESEARCH_TAG);
    return saved;
  });
}

// Sửa Hồ sơ nghiên cứu của Cảm hứng sau Duyệt (FR-2, FR-22): không đổi trạng thái gợi ý.
export async function saveInspirationResearch(input: SaveInspirationResearchInput): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = saveInspirationResearchInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await saveInspirationResearchRecord(parsed.data);
    updateTag(RESEARCH_TAG);
    return saved;
  });
}
