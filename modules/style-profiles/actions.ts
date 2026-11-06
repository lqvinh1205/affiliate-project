"use server";

import { updateTag } from "next/cache";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { firstError } from "@/platform/validation/errors";
import { styleProfileInputSchema, type StyleProfileFormValues } from "@/modules/style-profiles/schema";
import { saveStyleProfileRecord } from "@/modules/style-profiles/service";
import { STYLE_PROFILES_TAG } from "@/modules/style-profiles/tags";

// Lưu Hồ sơ phong cách (`/cms/phong-cach`, FR-18, UX-DR81). Hồ sơ chỉ đọc ở CMS (không cache); tag giữ cho đồng bộ.
export async function saveStyleProfile(input: StyleProfileFormValues): Promise<Result<{ id: string }>> {
  return run(async () => {
    const parsed = styleProfileInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const saved = await saveStyleProfileRecord(parsed.data);
    updateTag(STYLE_PROFILES_TAG);
    return { id: saved.id };
  });
}
