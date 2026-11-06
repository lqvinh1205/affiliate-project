import { z } from "zod";
import { Platform } from "@/generated/prisma/enums";
import { optionalText, requiredText } from "@/platform/validation/fields";
import {
  STYLE_DISCLOSURE_MAX,
  STYLE_EMOJI_MAX,
  STYLE_FORBIDDEN_MAX,
  STYLE_HARD_LIMITS,
  STYLE_PLATFORMS,
  STYLE_RULES_MAX,
  STYLE_VOICE_MAX,
} from "@/modules/style-profiles/constants";

// Số nguyên dương nhập ở ô chữ (form giữ chuỗi): "" → null khi tuỳ chọn.
const int = z
  .string()
  .trim()
  .regex(/^\d{1,5}$/, "Nhập số nguyên dương")
  .transform(Number);
const optionalInt = z.union([z.literal("").transform(() => null), int]);

const limitedText = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`);

// Sửa một Hồ sơ phong cách (FR-18, AD-25): mục tiêu mềm phải ≤ giới hạn cứng của nền tảng (vd Threads ≤ 500 ký
// tự/bài); lỗi gắn đúng trường và nêu giới hạn. Số bài/mục chỉ có ở nền tảng có mục này; câu công khai chỉ ở
// Threads, Facebook.
export const styleProfileInputSchema = z
  .object({
    platform: z.enum(Platform),
    voice: requiredText(STYLE_VOICE_MAX, "Nhập giọng văn"),
    lengthMin: int,
    lengthMax: int,
    partsMin: optionalInt,
    partsMax: optionalInt,
    emoji: limitedText(STYLE_EMOJI_MAX),
    forbidden: limitedText(STYLE_FORBIDDEN_MAX),
    rules: limitedText(STYLE_RULES_MAX),
    disclosure: optionalText.pipe(z.string().max(STYLE_DISCLOSURE_MAX, `Tối đa ${STYLE_DISCLOSURE_MAX} ký tự`).nullable()),
  })
  .superRefine((v, ctx) => {
    const meta = STYLE_PLATFORMS[v.platform];
    const hard = STYLE_HARD_LIMITS[v.platform];
    const unit = meta.length.unit;
    if (v.lengthMin < 1) ctx.addIssue({ code: "custom", path: ["lengthMin"], message: "Tối thiểu 1" });
    if (v.lengthMax > hard.lengthMax) {
      ctx.addIssue({ code: "custom", path: ["lengthMax"], message: `Tối đa ${hard.lengthMax} ${unit} (giới hạn cứng)` });
    }
    if (v.lengthMin > v.lengthMax) {
      ctx.addIssue({ code: "custom", path: ["lengthMin"], message: "Không được lớn hơn mức tối đa" });
    }
    if (!meta.parts || hard.partsMax === null) {
      if (v.partsMin !== null || v.partsMax !== null) {
        ctx.addIssue({ code: "custom", path: ["partsMin"], message: `${meta.label} không có mục này` });
      }
    } else {
      const partsUnit = meta.parts.unit;
      if (v.partsMin === null) ctx.addIssue({ code: "custom", path: ["partsMin"], message: "Nhập số tối thiểu" });
      if (v.partsMax === null) ctx.addIssue({ code: "custom", path: ["partsMax"], message: "Nhập số tối đa" });
      if (v.partsMin !== null && v.partsMin < 1) {
        ctx.addIssue({ code: "custom", path: ["partsMin"], message: "Tối thiểu 1" });
      }
      if (v.partsMax !== null && v.partsMax > hard.partsMax) {
        ctx.addIssue({ code: "custom", path: ["partsMax"], message: `Tối đa ${hard.partsMax} ${partsUnit} (giới hạn cứng)` });
      }
      if (v.partsMin !== null && v.partsMax !== null && v.partsMin > v.partsMax) {
        ctx.addIssue({ code: "custom", path: ["partsMin"], message: "Không được lớn hơn mức tối đa" });
      }
    }
    if (!meta.disclosure && v.disclosure) {
      ctx.addIssue({ code: "custom", path: ["disclosure"], message: `${meta.label} không có câu công khai` });
    }
  });

export type StyleProfileFormValues = z.input<typeof styleProfileInputSchema>;
export type StyleProfileInput = z.infer<typeof styleProfileInputSchema>;
