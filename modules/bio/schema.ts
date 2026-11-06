import { z } from "zod";
import { requiredText } from "@/platform/validation/fields";
import { BIO_DISCLOSURE_MAX, BIO_INTRO_MAX } from "@/modules/bio/constants";

const productId = z.string().min(1, "Thiếu Sản phẩm");

// Giới thiệu và câu công khai `/bio` (FR-31): câu công khai sửa được, không tắt được (bắt buộc có chữ).
export const bioSettingsInputSchema = z.object({
  intro: requiredText(BIO_INTRO_MAX, "Nhập phần giới thiệu"),
  disclosure: requiredText(BIO_DISCLOSURE_MAX, "Nhập câu công khai"),
});

export const setBioItemVisibleInputSchema = z.object({ productId, visible: z.boolean() });
export const setBioItemPinnedInputSchema = z.object({ productId, pinned: z.boolean() });
export const moveBioItemInputSchema = z.object({ productId, direction: z.enum(["up", "down"]) });

export type BioSettingsFormValues = z.input<typeof bioSettingsInputSchema>;
export type BioSettingsInput = z.infer<typeof bioSettingsInputSchema>;
