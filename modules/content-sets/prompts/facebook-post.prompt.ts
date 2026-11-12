import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";
import { UserError } from "@/platform/errors";
import { cleanRiskWarnings, RISK_WARNING_RULES, riskWarningsOutput } from "@/platform/ai/rules";
import { SITE_NAME } from "@/platform/site";
import type { StyleProfileValues } from "@/modules/style-profiles/constants";
import { FACEBOOK_POST_MAX } from "@/modules/content-sets/constants";
import { facebookPayloadSchema, stripUrls } from "@/modules/content-sets/schema";
import { socialUserPrompt, type SocialPostInput } from "@/modules/content-sets/prompts/threads-post.prompt";

export { facebookPayloadSchema } from "@/modules/content-sets/schema";

// Bài Facebook của Bộ nội dung (FR-15; spine AD-19): gợi ý `FACEBOOK_POST`, Duyệt thì upsert `SocialPost` (FACEBOOK).
// Một bài theo Hồ sơ phong cách Facebook, xuống dòng dễ đọc trên điện thoại, không link trong thân.

const facebookOutputSchema = z.object({ body: z.string(), riskWarnings: riskWarningsOutput });

export type FacebookOutput = z.infer<typeof facebookOutputSchema>;

export const facebookPostPrompt: PromptDef<SocialPostInput, typeof facebookOutputSchema, StyleProfileValues> = {
  id: "content-sets.facebook-post",
  version: 2,
  profile: "fast",
  output: facebookOutputSchema,
  system: (style) => `Bạn viết một Bài Facebook cho trang "${SITE_NAME}" theo Hồ sơ phong cách Facebook:
- Giọng văn: ${style.voice}
- Độ dài khoảng ${style.lengthMin}–${style.lengthMax} từ.
- Emoji: ${style.emoji}
- Điều cấm: ${style.forbidden}
- Nội quy và quy chuẩn: ${style.rules}
- "body" là một bài duy nhất, xuống dòng (\\n) sau 1–2 câu cho dễ đọc trên điện thoại; không chèn link hay đường dẫn nào (link đặt ở bình luận riêng).
${RISK_WARNING_RULES}`,
  user: socialUserPrompt,
};

export function toFacebookPayload(out: FacebookOutput) {
  const body = stripUrls(out.body).slice(0, FACEBOOK_POST_MAX);
  if (!body) throw new UserError("AI không trả Bài Facebook");
  return { payload: facebookPayloadSchema.parse({ body }), riskWarnings: cleanRiskWarnings(out.riskWarnings) };
}
