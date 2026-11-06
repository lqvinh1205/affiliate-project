"use server";

import { updateTag } from "next/cache";
import type { z } from "zod";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import {
  bioSettingsInputSchema,
  moveBioItemInputSchema,
  setBioItemPinnedInputSchema,
  setBioItemVisibleInputSchema,
  type BioSettingsFormValues,
} from "@/modules/bio/schema";
import {
  moveBioItemRecord,
  saveBioSettingsRecord,
  setBioItemPinnedRecord,
  setBioItemVisibleRecord,
} from "@/modules/bio/service";
import { BIO_TAG } from "@/modules/bio/tags";

// Ghi của `/cms/bio` (FR-31): mỗi thao tác lưu ngay; `/bio` và dải Trang chủ gắn tag `bio` nên thấy ngay (AD-7).
// Chỉ bảng của `bio` đổi → chỉ `updateTag(BIO_TAG)`.

export async function saveBioSettings(input: BioSettingsFormValues): Promise<Result> {
  return run(async () => {
    const parsed = bioSettingsInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    await saveBioSettingsRecord(parsed.data);
    updateTag(BIO_TAG);
    return {};
  });
}

export async function setBioItemVisible(input: z.input<typeof setBioItemVisibleInputSchema>): Promise<Result> {
  return run(async () => {
    const parsed = setBioItemVisibleInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    await setBioItemVisibleRecord(parsed.data);
    updateTag(BIO_TAG);
    return {};
  });
}

export async function setBioItemPinned(input: z.input<typeof setBioItemPinnedInputSchema>): Promise<Result> {
  return run(async () => {
    const parsed = setBioItemPinnedInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    await setBioItemPinnedRecord(parsed.data);
    updateTag(BIO_TAG);
    return {};
  });
}

export async function moveBioItem(input: z.input<typeof moveBioItemInputSchema>): Promise<Result> {
  return run(async () => {
    const parsed = moveBioItemInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    await moveBioItemRecord(parsed.data);
    updateTag(BIO_TAG);
    return {};
  });
}
