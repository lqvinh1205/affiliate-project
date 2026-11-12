import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";
import { visibleText } from "@/platform/html/content";
import { cleanRiskWarnings, RISK_WARNING_RULES, riskWarningsOutput } from "@/platform/ai/rules";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import { SITE_NAME } from "@/platform/site";
import type { StyleProfileValues } from "@/modules/style-profiles/constants";
import { POST_CONTENT_MAX, POST_EXCERPT_MAX, POST_TITLE_MAX } from "@/modules/posts/constants";

// AI chỉnh sửa Bài web đang soạn (FR-40; ngoại lệ AD-9: `posts.rewritePostDraft` trả nội dung cho form, không lưu,
// không qua Duyệt). Giọng văn, độ dài theo Hồ sơ phong cách Website (FR-18), cùng các trường với `web-post`.

export type RewritePostPromptInput = {
  title: string;
  excerpt: string;
  content: string;
  instruction: string | null;
};

const rewritePostOutputSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  riskWarnings: riskWarningsOutput,
});

export type RewritePostOutput = z.infer<typeof rewritePostOutputSchema>;

export const rewritePostPrompt: PromptDef<RewritePostPromptInput, typeof rewritePostOutputSchema, StyleProfileValues> = {
  id: "posts.rewrite-post",
  version: 2,
  profile: "quality",
  output: rewritePostOutputSchema,
  system: (style) => `Bạn là biên tập viên của trang "${SITE_NAME}" — tạp chí đời sống cho người Việt. Viết lại bài được cho thành bài của trang, theo Hồ sơ phong cách Website:
- Giọng văn: ${style.voice}
- Độ dài thân bài: ${style.lengthMin}–${style.lengthMax} từ, ${style.partsMin ?? 3}–${style.partsMax ?? 5} mục h2.
- Emoji: ${style.emoji}
- Điều cấm: ${style.forbidden}
- Quy chuẩn: ${style.rules}
Cách viết lại:
- Giữ đúng thông tin và ý chính của bài; diễn đạt lại bằng lời mới, không chép nguyên câu, không bịa thêm thông tin.
- Viết lại cả "title" (tiêu đề) và "excerpt" (tóm tắt 1–2 câu).
- "content" là HTML chỉ dùng các thẻ h2, h3, p, ul, ol, li, strong, em, blockquote. Không h1, không link, không ảnh, không giá.
${RISK_WARNING_RULES}`,
  user: (input) => `Bài cần viết lại:
Tiêu đề: ${input.title || "(trống)"}
Tóm tắt: ${input.excerpt || "(trống)"}
Thân bài (HTML):
${input.content}
${input.instruction ? `\nChỉ dẫn khi viết lại: ${input.instruction}` : ""}`,
};

const clip = (s: string, max: number) => s.trim().slice(0, max);

// Kết quả AI → giá trị điền form: HTML qua `sanitizePostHtml` (AD-22), cắt về giới hạn cứng, cảnh báo rủi ro đã lọc.
// Thân bài sau lọc rỗng → `null` (action báo AI trả sai định dạng). Tiêu đề, tóm tắt trống giữ giá trị cũ.
export function toRewrittenPost(out: RewritePostOutput, ctx: { title: string; excerpt: string }) {
  const content = sanitizePostHtml(out.content).slice(0, POST_CONTENT_MAX);
  if (!visibleText(content)) return null;
  return {
    title: clip(out.title, POST_TITLE_MAX) || clip(ctx.title, POST_TITLE_MAX) || "Bài viết mới",
    excerpt: clip(out.excerpt, POST_EXCERPT_MAX) || clip(ctx.excerpt, POST_EXCERPT_MAX),
    content,
    riskWarnings: cleanRiskWarnings(out.riskWarnings),
  };
}
