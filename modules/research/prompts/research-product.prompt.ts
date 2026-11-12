import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";
import { SITE_NAME } from "@/platform/site";
import {
  RESEARCH_ANGLES_MAX,
  RESEARCH_ANGLES_MIN,
  RESEARCH_AUDIENCES_MAX,
  RESEARCH_AUDIENCES_MIN,
  RESEARCH_CATEGORY_REASON_MAX,
  RESEARCH_IMAGE_DESCRIPTION_MAX,
  RESEARCH_INFO_MAX,
  RESEARCH_INFO_TEXT_MAX,
  RESEARCH_NAME_MAX,
  RESEARCH_NOTE_MAX,
  RESEARCH_REASON_MAX,
  RESEARCH_REVIEW_ITEM_MAX,
  RESEARCH_REVIEW_ITEMS_MAX,
} from "@/modules/research/constants";

// Nghiên cứu một Sản phẩm (FR-6..FR-11, spine AD-19): **một** lần gọi AI trả cả hồ sơ lẫn Danh mục gợi ý; điều phối
// ở `modules/suggestions/actions.ts` ghi thành hai gợi ý `RESEARCH` và `PRODUCT_CATEGORY`.

export type ResearchPromptInput = {
  name: string;
  priceText: string | null;
  affiliateUrl: string;
  rawText: string | null;
  rawReviews: string | null;
  imageCount: number;
  categories: { id: string; name: string }[];
  // Chỉ dẫn khi Tạo lại (FR-21), vd "ngắn hơn".
  instruction: string | null;
};

// ---------- Kết quả AI (không transform: sinh JSON Schema cho nhà cung cấp) ----------

const researchOutputSchema = z.object({
  info: z.array(z.object({ text: z.string(), sourceUrl: z.string().nullable() })),
  infoNote: z.string().nullable(),
  imageDescription: z.string().nullable(),
  reviewSummary: z
    .object({ praise: z.array(z.string()), complaints: z.array(z.string()), fit: z.array(z.string()) })
    .nullable(),
  audiences: z.array(z.object({ name: z.string(), reason: z.string() })).min(RESEARCH_AUDIENCES_MIN),
  angles: z.array(z.object({ name: z.string(), hook: z.string() })).min(RESEARCH_ANGLES_MIN),
  category: z.object({ categoryId: z.string().nullable(), reason: z.string() }),
});

export type ResearchOutput = z.infer<typeof researchOutputSchema>;

export const researchProductPrompt: PromptDef<ResearchPromptInput, typeof researchOutputSchema> = {
  id: "research.product",
  version: 2,
  profile: "quality",
  output: researchOutputSchema,
  system: () => `Bạn là người nghiên cứu sản phẩm cho trang "${SITE_NAME}" (đồ gia dụng, nhà cửa, làm đẹp… bán trên Shopee).
Nhiệm vụ: lập Hồ sơ nghiên cứu để người viết dùng làm nội dung. Trả về JSON:
- "info": tối đa ${RESEARCH_INFO_MAX} ý về công dụng, cách dùng, nhận xét chung tìm được trên web; mỗi ý một câu ngắn và "sourceUrl" là đúng link trang bạn đã đọc ý đó. Chỉ ghi ý có nguồn; không tìm được nguồn thì để "info" rỗng.
- "infoNote": khi "info" rỗng hoặc thông tin ít, một câu nói rõ là không tìm được thông tin công khai (không bịa); ngược lại null.
- "imageDescription": nếu có ảnh, mô tả hình dáng, màu sắc, chất liệu nhìn thấy và chữ trên bao bì; ảnh có chữ rõ thì trích tên sản phẩm hoặc dòng chữ chính. Không có ảnh thì null.
- "reviewSummary": chỉ dựa trên đánh giá người dùng được cung cấp, mỗi mục tối đa ${RESEARCH_REVIEW_ITEMS_MAX} ý ngắn: "praise" (điểm được khen), "complaints" (điểm bị chê), "fit" (người dùng phù hợp). Không thêm ý ngoài đánh giá. Không có đánh giá thì null.
- "audiences": ${RESEARCH_AUDIENCES_MIN}–${RESEARCH_AUDIENCES_MAX} nhóm Người đọc mục tiêu, mỗi nhóm có "name" ngắn và "reason" (vì sao hợp).
- "angles": ${RESEARCH_ANGLES_MIN}–${RESEARCH_ANGLES_MAX} Góc viết khác nhau, mỗi góc có "name" ngắn và "hook" là một câu mở đầu mẫu (không giật tít sai sự thật, không nêu giá).
- "category": chọn đúng một Danh mục trong danh sách được cho, ghi "categoryId" đúng id và "reason" ngắn; không có Danh mục nào hợp thì "categoryId" null.
Khi được cho link sản phẩm Shopee, không cần mở link đó (thường cần đăng nhập); tìm theo tên sản phẩm.`,
  user: (input) => {
    const categories = input.categories.map((c) => `- ${c.id}: ${c.name}`).join("\n") || "(chưa có Danh mục nào)";
    return `Sản phẩm: ${input.name}
Giá tham khảo: ${input.priceText || "(không có)"}
Link affiliate: ${input.affiliateUrl}
Mô tả dán từ trang bán:
${input.rawText || "(không có)"}

Đánh giá người dùng dán vào:
${input.rawReviews || "(không có đánh giá — reviewSummary phải là null)"}

Ảnh: ${input.imageCount > 0 ? `${input.imageCount} ảnh kèm theo` : "không có ảnh — imageDescription phải là null"}

Danh mục có sẵn (id: tên):
${categories}
${input.instruction ? `\nChỉ dẫn khi viết lại: ${input.instruction}` : ""}`;
  },
};

// ---------- Payload các gợi ý (AD-19: Zod của mỗi `kind` theo prompt của miền) ----------

const text = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`);
const required = (max: number, message: string) => text(max).min(1, message);
const nullableText = (max: number) =>
  z
    .string()
    .nullable()
    .transform((s) => s?.trim() || null)
    .pipe(z.string().max(max, `Tối đa ${max} ký tự`).nullable());
// Danh sách ý ngắn: bỏ ý trống (form để trống một ô là bỏ ý đó).
const lines = z
  .array(text(RESEARCH_REVIEW_ITEM_MAX))
  .max(RESEARCH_REVIEW_ITEMS_MAX)
  .transform((items) => items.filter(Boolean));
const choiceId = z.string().min(1).max(40);

// Link nguồn chỉ nhận http(s) (render thành `href`): AI hoặc form gửi giá trị khác thì bị từ chối / bỏ.
function isHttpUrl(s: string) {
  try {
    return /^https?:$/.test(new URL(s).protocol);
  } catch {
    return false;
  }
}
const sourceUrl = z
  .string()
  .max(2000)
  .refine(isHttpUrl, "Link nguồn không hợp lệ")
  .nullable();

// Payload `RESEARCH` và dữ liệu `ResearchProfile.data`. Người đọc, Góc viết, ý Thông tin có `id` ổn định (AD-19):
// chọn theo `id`, không theo vị trí.
export const researchProfileSchema = z.object({
  info: z
    .array(z.object({ id: choiceId, text: text(RESEARCH_INFO_TEXT_MAX), sourceUrl }))
    .max(RESEARCH_INFO_MAX)
    .transform((items) => items.filter((i) => i.text)),
  infoNote: nullableText(RESEARCH_NOTE_MAX),
  imageDescription: nullableText(RESEARCH_IMAGE_DESCRIPTION_MAX),
  reviewSummary: z.object({ praise: lines, complaints: lines, fit: lines }).nullable(),
  audiences: z
    .array(
      z.object({
        id: choiceId,
        name: required(RESEARCH_NAME_MAX, "Nhập tên nhóm"),
        reason: text(RESEARCH_REASON_MAX),
      }),
    )
    .min(RESEARCH_AUDIENCES_MIN)
    .max(RESEARCH_AUDIENCES_MAX),
  angles: z
    .array(
      z.object({
        id: choiceId,
        name: required(RESEARCH_NAME_MAX, "Nhập tên góc viết"),
        hook: text(RESEARCH_REASON_MAX),
      }),
    )
    .min(RESEARCH_ANGLES_MIN)
    .max(RESEARCH_ANGLES_MAX),
});

// Payload `PRODUCT_CATEGORY` (FR-11): Danh mục có sẵn AI chọn; Duyệt ghi `Product.categoryId` (AD-19).
export const productCategoryPayloadSchema = z.object({
  categoryId: z.uuid(),
  categoryName: z.string().max(120),
  reason: z.string().max(RESEARCH_CATEGORY_REASON_MAX),
});

export type ResearchProfileData = z.infer<typeof researchProfileSchema>;
export type ProductCategoryPayload = z.infer<typeof productCategoryPayloadSchema>;

const clip = (s: string | null | undefined, max: number) => (s ?? "").trim().slice(0, max);

// Kết quả AI → payload hai gợi ý: gán `id` ổn định, cắt về giới hạn cứng, bỏ phần không có dữ liệu nguồn
// (không có đánh giá → không có Khen/Chê/Phù hợp — FR-8; không có ảnh → không mô tả ảnh — FR-7); Danh mục chỉ nhận
// id có trong danh sách đã gửi (FR-11), không có thì `category` là null.
export function toResearchPayloads(
  out: ResearchOutput,
  ctx: { hasReviews: boolean; hasImages: boolean; categories: { id: string; name: string }[] },
): { profile: ResearchProfileData; category: ProductCategoryPayload | null } {
  const list = (items: string[]) =>
    items.map((s) => clip(s, RESEARCH_REVIEW_ITEM_MAX)).filter(Boolean).slice(0, RESEARCH_REVIEW_ITEMS_MAX);
  const profile = researchProfileSchema.parse({
    info: out.info.slice(0, RESEARCH_INFO_MAX).map((i, n) => ({
      id: `info-${n + 1}`,
      text: clip(i.text, RESEARCH_INFO_TEXT_MAX),
      sourceUrl: i.sourceUrl && isHttpUrl(i.sourceUrl.trim()) ? i.sourceUrl.trim().slice(0, 2000) : null,
    })),
    infoNote: clip(out.infoNote, RESEARCH_NOTE_MAX) || null,
    imageDescription: ctx.hasImages ? clip(out.imageDescription, RESEARCH_IMAGE_DESCRIPTION_MAX) || null : null,
    reviewSummary:
      ctx.hasReviews && out.reviewSummary
        ? {
            praise: list(out.reviewSummary.praise),
            complaints: list(out.reviewSummary.complaints),
            fit: list(out.reviewSummary.fit),
          }
        : null,
    audiences: out.audiences.slice(0, RESEARCH_AUDIENCES_MAX).map((a, n) => ({
      id: `doc-gia-${n + 1}`,
      name: clip(a.name, RESEARCH_NAME_MAX) || `Nhóm ${n + 1}`,
      reason: clip(a.reason, RESEARCH_REASON_MAX),
    })),
    angles: out.angles.slice(0, RESEARCH_ANGLES_MAX).map((a, n) => ({
      id: `goc-viet-${n + 1}`,
      name: clip(a.name, RESEARCH_NAME_MAX) || `Góc viết ${n + 1}`,
      hook: clip(a.hook, RESEARCH_REASON_MAX),
    })),
  });
  const picked = ctx.categories.find((c) => c.id === out.category.categoryId?.trim());
  const category = picked
    ? { categoryId: picked.id, categoryName: picked.name, reason: clip(out.category.reason, RESEARCH_CATEGORY_REASON_MAX) }
    : null;
  return { profile, category };
}
