"use server";

import { updateTag } from "next/cache";
import type { z } from "zod";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import {
  bannerInputSchema,
  deleteBannerInputSchema,
  moveBannerInputSchema,
  type BannerFormValues,
} from "@/modules/banners/schema";
import { deleteBannerRecord, moveBannerRecord, saveBannerRecord } from "@/modules/banners/service";
import { BANNERS_TAG } from "@/modules/banners/tags";

// Mọi ghi Banner làm mới tag `banners`: Trang chủ đổi ngay, không chờ hết 60 giây của `getLiveBanners` (AD-7).

export async function saveBanner(input: BannerFormValues): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = bannerInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await saveBannerRecord(parsed.data);
    updateTag(BANNERS_TAG);
    return saved;
  });
}

export async function moveBanner(input: z.input<typeof moveBannerInputSchema>): Promise<Result> {
  return run(async () => {
    const parsed = moveBannerInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    await moveBannerRecord(parsed.data);
    updateTag(BANNERS_TAG);
    return {};
  });
}

export async function deleteBanner(input: z.input<typeof deleteBannerInputSchema>): Promise<Result> {
  return run(async () => {
    const parsed = deleteBannerInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    await deleteBannerRecord(parsed.data);
    updateTag(BANNERS_TAG);
    return {};
  });
}
