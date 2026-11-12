import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";
import { UserError } from "@/platform/errors";
import { cleanRiskWarnings, RISK_WARNING_RULES, riskWarningsOutput } from "@/platform/ai/rules";
import { SITE_NAME } from "@/platform/site";
import type { StyleProfileValues } from "@/modules/style-profiles/constants";
import { PLATFORM_LABEL, type SocialPlatform } from "@/modules/content-sets/constants";
import { linkCommentMax, linkCommentPayloadSchema, URL_PATTERN } from "@/modules/content-sets/schema";

export { linkCommentPayloadSchema, linkCommentSchemaFor } from "@/modules/content-sets/schema";

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
  version: 3,
  profile: "fast",
  output: linkCommentOutputSchema,
  system: (style) => `Bạn viết Bình luận kèm link cho bài mạng xã hội của trang "${SITE_NAME}" — bình luận đầu tiên dưới bài, nơi người đọc lấy link mua.
- Giọng văn: ${style.voice}
- Emoji: ${style.emoji}
- Điều cấm: ${style.forbidden}
- Ngắn gọn (2–5 dòng): một câu dẫn, rồi mỗi Sản phẩm một dòng gồm tên ngắn và đúng nguyên văn link được cho. Không rút gọn, không sửa, không bịa link khác.
- Có câu công khai thì giữ nguyên văn câu đó ở cuối bình luận.
${RISK_WARNING_RULES}`,
  user: (input) => `Nền tảng: ${PLATFORM_LABEL[input.platform]} (cả bình luận không quá ${linkCommentMax(input.platform)} ký tự)
Góc viết của bài: ${input.angle ?? "(theo bài)"}
Sản phẩm và link (giữ nguyên văn link):
${input.products.map((p) => `- ${p.name}: ${p.affiliateUrl}`).join("\n")}
Câu công khai: ${input.disclosure ?? "(không có — không thêm)"}
${input.instruction ? `\nChỉ dẫn khi viết lại: ${input.instruction}` : ""}`,
};

// Phần bắt buộc (Link affiliate + câu công khai) không vừa giới hạn của nền tảng kể cả khi rút tên Sản phẩm: Tạo lại
// cũng hỏng y như vậy, nên thẻ hiện lý do riêng (thay câu chung UX-DR96) để Vinh sửa link ở Sản phẩm.
export class LinkCommentTooLongError extends UserError {}

const shortName = (name: string, max: number) =>
  max <= 0 ? "" : name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name;

// Kết quả AI → payload (FR-17, FR-18): bỏ mọi link không phải Link affiliate của bộ (AI bịa/rút gọn, kể cả tên miền
// trần); thêm dòng "👉 Tên: link" cho Sản phẩm chưa có link; thêm câu công khai khi hồ sơ có mà AI chưa chép. Giới hạn
// theo nền tảng (`linkCommentMax`: Threads 500): phần chữ AI bị cắt trước, rồi rút gọn tên Sản phẩm ở dòng link; vẫn
// không vừa → `LinkCommentTooLongError`.
export function toLinkCommentPayload(
  out: LinkCommentOutput,
  ctx: { platform: SocialPlatform; products: { name: string; affiliateUrl: string }[]; disclosure: string | null },
) {
  const max = linkCommentMax(ctx.platform);
  const allowed = new Set(ctx.products.map((p) => p.affiliateUrl));
  let text = out.comment
    .replace(URL_PATTERN, (url) => (allowed.has(url) ? url : ""))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  const disclosure = ctx.disclosure?.trim();
  const tailFor = (t: string, nameMax: number) => {
    const extra = ctx.products
      .filter((p) => !t.includes(p.affiliateUrl))
      .map((p) => {
        const name = shortName(p.name, nameMax);
        return name ? `👉 ${name}: ${p.affiliateUrl}` : `👉 ${p.affiliateUrl}`;
      });
    if (disclosure && !t.includes(disclosure)) extra.push(disclosure);
    return extra.join("\n");
  };
  const nameMax = [Infinity, 40, 0].find((n) => tailFor("", n).length <= max);
  if (nameMax === undefined) {
    throw new LinkCommentTooLongError(
      `Link affiliate và câu công khai dài quá ${max} ký tự của Bình luận ${PLATFORM_LABEL[ctx.platform]}. Rút gọn Link affiliate ở Sản phẩm rồi Tạo lại.`,
    );
  }
  const fits = () => text.length + (tail ? tail.length + 1 : 0) <= max;
  let tail = tailFor(text, nameMax);
  // Quá dài: cắt phần chữ ở ranh giới từ (không để lại nửa link) rồi tính lại phần phải thêm.
  for (let i = 0; i < 4 && !fits(); i++) {
    const room = Math.max(0, max - (tail ? tail.length + 1 : 0));
    text = text.slice(0, room).replace(/\S*$/, "").trim();
    tail = tailFor(text, nameMax);
  }
  if (!fits()) {
    text = "";
    tail = tailFor("", nameMax);
  }
  const comment = [text, tail].filter(Boolean).join("\n");
  return { payload: linkCommentPayloadSchema.parse({ comment }), riskWarnings: cleanRiskWarnings(out.riskWarnings) };
}
