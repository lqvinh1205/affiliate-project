import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";
import { cleanRiskWarnings, RISK_WARNING_RULES, riskWarningsOutput } from "@/platform/ai/rules";
import type { StyleProfileValues } from "@/modules/style-profiles/constants";
import { LINK_COMMENT_MAX, PLATFORM_LABEL, type SocialPlatform } from "@/modules/content-sets/constants";

// Bình luận kèm link (FR-17, FR-18; spine AD-19): gợi ý `LINK_COMMENT` cho mỗi nền tảng mạng xã hội, Duyệt thì ghi
// `SocialPost.linkComment`. Chứa **nguyên** Link affiliate của (các) Sản phẩm, dẫn thẳng Shopee (FR-25); có câu công
// khai khi hồ sơ đã điền. Hai điều này do code bảo đảm (`toLinkCommentPayload`), không phó mặc cho AI.

export type LinkCommentInput = {
  platform: SocialPlatform;
  products: { name: string; affiliateUrl: string }[];
  angle: string | null;
  disclosure: string | null;
  instruction: string | null;
};

const linkCommentOutputSchema = z.object({ comment: z.string(), riskWarnings: riskWarningsOutput });

export type LinkCommentOutput = z.infer<typeof linkCommentOutputSchema>;

export const linkCommentPrompt: PromptDef<LinkCommentInput, typeof linkCommentOutputSchema, StyleProfileValues> = {
  id: "content-sets.link-comment",
  version: 1,
  profile: "fast",
  output: linkCommentOutputSchema,
  system: (style) => `Bạn viết Bình luận kèm link cho bài mạng xã hội của trang "Mẹo Vặt Cuộc Sống" — bình luận đầu tiên dưới bài, nơi người đọc lấy link mua.
- Giọng văn: ${style.voice}
- Emoji: ${style.emoji}
- Điều cấm: ${style.forbidden}
- Ngắn gọn (2–5 dòng): một câu dẫn, rồi mỗi Sản phẩm một dòng gồm tên ngắn và đúng nguyên văn link được cho. Không rút gọn, không sửa, không bịa link khác.
- Có câu công khai thì giữ nguyên văn câu đó ở cuối bình luận.
${RISK_WARNING_RULES}`,
  user: (input) => `Nền tảng: ${PLATFORM_LABEL[input.platform]}
Góc viết của bài: ${input.angle ?? "(theo bài)"}
Sản phẩm và link (giữ nguyên văn link):
${input.products.map((p) => `- ${p.name}: ${p.affiliateUrl}`).join("\n")}
Câu công khai: ${input.disclosure ?? "(không có — không thêm)"}
${input.instruction ? `\nChỉ dẫn khi viết lại: ${input.instruction}` : ""}`,
};

// Payload gợi ý `LINK_COMMENT` và nội dung Duyệt / sửa sau Duyệt.
export const linkCommentPayloadSchema = z.object({
  comment: z.string().trim().min(1, "Bình luận đang trống").max(LINK_COMMENT_MAX, `Tối đa ${LINK_COMMENT_MAX} ký tự`),
});

export type LinkCommentPayload = z.infer<typeof linkCommentPayloadSchema>;

// Kết quả AI → payload (FR-17, FR-18): bỏ mọi URL không phải Link affiliate của bộ (AI bịa/rút gọn); thêm dòng
// "Tên: link" cho Sản phẩm chưa có link; thêm câu công khai khi hồ sơ có mà AI chưa chép. Phần chữ AI bị cắt trước
// để link và câu công khai luôn còn trong `LINK_COMMENT_MAX`.
export function toLinkCommentPayload(
  out: LinkCommentOutput,
  ctx: { products: { name: string; affiliateUrl: string }[]; disclosure: string | null },
) {
  const allowed = new Set(ctx.products.map((p) => p.affiliateUrl));
  let text = out.comment
    .replace(/https?:\/\/[^\s)\]]+/gi, (url) => (allowed.has(url) ? url : ""))
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  const disclosure = ctx.disclosure?.trim();
  const tailFor = (t: string) => {
    const extra = ctx.products.filter((p) => !t.includes(p.affiliateUrl)).map((p) => `👉 ${p.name}: ${p.affiliateUrl}`);
    if (disclosure && !t.includes(disclosure)) extra.push(disclosure);
    return extra.join("\n");
  };
  let tail = tailFor(text);
  // Quá dài: cắt phần chữ ở ranh giới từ (không để lại nửa link) rồi tính lại phần phải thêm.
  for (let i = 0; i < 4 && text.length + (tail ? tail.length + 1 : 0) > LINK_COMMENT_MAX; i++) {
    const room = Math.max(0, LINK_COMMENT_MAX - (tail ? tail.length + 1 : 0));
    text = text.slice(0, room).replace(/\S*$/, "").trim();
    tail = tailFor(text);
  }
  const comment = [text, tail].filter(Boolean).join("\n");
  return { payload: linkCommentPayloadSchema.parse({ comment }), riskWarnings: cleanRiskWarnings(out.riskWarnings) };
}
