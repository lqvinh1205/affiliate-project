import { z } from "zod";
import { PostType } from "@/generated/prisma/enums";
import type { PromptDef } from "@/platform/ai/ask";
import { cleanRiskWarnings, RISK_WARNING_RULES, riskWarningsOutput } from "@/platform/ai/rules";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import type { StyleProfileValues } from "@/modules/style-profiles/constants";
import {
  POST_CONTENT_MAX,
  POST_EXCERPT_MAX,
  POST_SEO_DESCRIPTION_MAX,
  POST_SEO_TITLE_MAX,
  POST_TAG_MAX,
  POST_TAGS_MAX,
  POST_TITLE_MAX,
  POST_TYPES,
} from "@/modules/posts/constants";

// Bài web của Bộ nội dung (FR-11, FR-13; spine AD-19): gợi ý `WEB_POST`, Duyệt thì ghi vào `Post` nháp của bộ.
// Điều phối ở `modules/suggestions/actions.ts`. Giọng văn, độ dài theo Hồ sơ phong cách Website (FR-18, AD-25).

export type WebPostInput = {
  // Dữ liệu nguồn đã dựng sẵn từ Hồ sơ nghiên cứu (hoặc Bài web có sẵn) của (các) Sản phẩm.
  source: string;
  productNames: string[];
  angle: string | null;
  audience: string | null;
  categories: { id: string; name: string }[];
  // Chỉ dẫn khi Tạo lại (FR-21).
  instruction: string | null;
};

// Kết quả AI (không transform: sinh JSON Schema cho nhà cung cấp).
const webPostOutputSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  seoTitle: z.string(),
  seoDescription: z.string(),
  seoKeywords: z.array(z.string()),
  postType: z.enum(PostType),
  categoryId: z.string().nullable(),
  riskWarnings: riskWarningsOutput,
});

export type WebPostOutput = z.infer<typeof webPostOutputSchema>;

const postTypeList = (Object.keys(POST_TYPES) as PostType[])
  .map((k) => `${k} (${POST_TYPES[k].label}: ${POST_TYPES[k].description})`)
  .join("; ");

export const webPostPrompt: PromptDef<WebPostInput, typeof webPostOutputSchema, StyleProfileValues> = {
  id: "posts.web-post",
  version: 2,
  profile: "quality",
  output: webPostOutputSchema,
  system: (style) => `Bạn là biên tập viên của trang "Mẹo Vặt Cuộc Sống" — tạp chí đời sống cho người Việt. Viết một Bài web theo Hồ sơ phong cách Website:
- Giọng văn: ${style.voice}
- Độ dài thân bài: ${style.lengthMin}–${style.lengthMax} từ, ${style.partsMin ?? 3}–${style.partsMax ?? 5} mục h2.
- Emoji: ${style.emoji}
- Điều cấm: ${style.forbidden}
- Quy chuẩn: ${style.rules}
Định dạng:
- "content" là HTML chỉ dùng các thẻ h2, h3, p, ul, ol, li, strong, em, blockquote. Không h1, không link, không ảnh, không giá.
- "postType": một trong ${postTypeList}.
- "categoryId": đúng id một Danh mục trong danh sách được cho; không có Danh mục nào hợp thì null.
${RISK_WARNING_RULES}`,
  user: (input) => {
    const categories = input.categories.map((c) => `- ${c.id}: ${c.name}`).join("\n") || "(chưa có Danh mục nào)";
    return `Sản phẩm trong bài: ${input.productNames.join("; ")}
Góc viết: ${input.angle ?? "(tự chọn góc phù hợp nhất với dữ liệu)"}
Người đọc mục tiêu: ${input.audience ?? "(người đọc chung của trang)"}

Dữ liệu nguồn (chỉ dùng thông tin có ở đây, không bịa thêm):
${input.source}

Danh mục có sẵn (id: tên):
${categories}
${input.instruction ? `\nChỉ dẫn khi viết lại: ${input.instruction}` : ""}`;
  },
};

// ---------- Payload `WEB_POST` (AD-19: Zod của kind theo prompt của module chủ đích) ----------

const text = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`);
const list = z.array(z.string().trim().min(1).max(POST_TAG_MAX)).max(POST_TAGS_MAX);

// Payload gợi ý `WEB_POST` và nội dung Duyệt (sửa trên thẻ): đúng giới hạn cứng của Bài web.
export const webPostPayloadSchema = z.object({
  title: text(POST_TITLE_MAX).min(1, "Nhập tiêu đề"),
  excerpt: text(POST_EXCERPT_MAX),
  content: z.string().max(POST_CONTENT_MAX, "Nội dung quá dài"),
  tags: list,
  seoTitle: text(POST_SEO_TITLE_MAX),
  seoDescription: text(POST_SEO_DESCRIPTION_MAX),
  seoKeywords: list,
  postType: z.enum(PostType),
  categoryId: z.uuid().nullable(),
  categoryName: z.string().max(120).nullable(),
});

export type WebPostPayload = z.infer<typeof webPostPayloadSchema>;

const clip = (s: string, max: number) => s.trim().slice(0, max);
const clipList = (items: string[]) => {
  const seen = new Set<string>();
  return items
    .map((x) => x.replace(/,/g, " ").replace(/\s+/g, " ").trim().slice(0, POST_TAG_MAX).trim())
    .filter((x) => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase()))
    .slice(0, POST_TAGS_MAX);
};

// Kết quả AI → payload: HTML qua `sanitizePostHtml` (AD-22 — bỏ link, ảnh), cắt về giới hạn cứng thay vì từ chối,
// Danh mục chỉ nhận id có trong danh sách đã gửi (FR-11). Cảnh báo rủi ro tách riêng (cột `Suggestion.riskWarnings`).
export function toWebPostPayload(out: WebPostOutput, ctx: { categories: { id: string; name: string }[] }) {
  const picked = ctx.categories.find((c) => c.id === out.categoryId?.trim());
  const payload = webPostPayloadSchema.parse({
    title: clip(out.title, POST_TITLE_MAX) || "Bài viết mới",
    excerpt: clip(out.excerpt, POST_EXCERPT_MAX),
    content: sanitizePostHtml(out.content).slice(0, POST_CONTENT_MAX),
    tags: clipList(out.tags),
    seoTitle: clip(out.seoTitle, POST_SEO_TITLE_MAX),
    seoDescription: clip(out.seoDescription, POST_SEO_DESCRIPTION_MAX),
    seoKeywords: clipList(out.seoKeywords),
    postType: out.postType,
    categoryId: picked?.id ?? null,
    categoryName: picked?.name ?? null,
  });
  return { payload, riskWarnings: cleanRiskWarnings(out.riskWarnings) };
}
