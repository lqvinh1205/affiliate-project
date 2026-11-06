import { z } from "zod";
import { isAllowedImageUrl } from "@/platform/images";
import { parseVietnamDateTime } from "@/platform/format";
import { optionalText, requiredText } from "@/platform/validation/fields";
import { BANNER_DESCRIPTION_MAX, BANNER_LINK_MAX, BANNER_TITLE_MAX } from "@/modules/banners/constants";
import { bannerLinkKind } from "@/modules/banners/link";

const bannerId = z.string().min(1, "Thiếu Banner");

const image = z
  .string()
  .trim()
  .min(1, "Chọn ảnh hoặc dán link ảnh")
  .refine(isAllowedImageUrl, "Ảnh phải là link https từ Shopee hoặc đường dẫn trong site");

const linkUrl = z
  .string()
  .trim()
  .min(1, "Nhập link đích")
  .max(BANNER_LINK_MAX, `Tối đa ${BANNER_LINK_MAX} ký tự`)
  .refine(
    (s) => bannerLinkKind(s) !== null,
    "Link sang Shopee phải thuộc shopee.vn, s.shopee.vn, shope.ee; link trong site bắt đầu bằng /",
  );

// Ô datetime-local (giờ Việt Nam): "" → null (không giới hạn), sai dạng → lỗi tại trường.
const scheduleTime = z.string().transform((s, ctx) => {
  if (!s.trim()) return null;
  const d = parseVietnamDateTime(s.trim());
  if (!d) {
    ctx.addIssue({ code: "custom", message: "Ngày giờ không hợp lệ" });
    return z.NEVER;
  }
  return d;
});

export const bannerInputSchema = z
  .object({
    id: bannerId.optional(),
    title: requiredText(BANNER_TITLE_MAX, "Nhập tiêu đề"),
    description: optionalText.pipe(
      z.string().max(BANNER_DESCRIPTION_MAX, `Tối đa ${BANNER_DESCRIPTION_MAX} ký tự`).nullable(),
    ),
    image,
    linkUrl,
    enabled: z.boolean(),
    startsAt: scheduleTime,
    endsAt: scheduleTime,
  })
  // Cùng luật với CHECK `Banner_schedule_check` của migration `add_banner`.
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt, {
    message: "Giờ kết thúc phải sau giờ bắt đầu",
    path: ["endsAt"],
  });

export const deleteBannerInputSchema = z.object({ id: bannerId });

export const moveBannerInputSchema = z.object({ id: bannerId, direction: z.enum(["up", "down"]) });

// Giá trị form (trường tuỳ chọn và ngày giờ là "" — Consistency Conventions) và dữ liệu đã parse.
export type BannerFormValues = z.input<typeof bannerInputSchema>;
export type BannerInput = z.infer<typeof bannerInputSchema>;
export type MoveDirection = z.infer<typeof moveBannerInputSchema>["direction"];
