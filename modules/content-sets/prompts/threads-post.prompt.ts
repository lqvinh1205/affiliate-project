import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";
import { UserError } from "@/platform/errors";
import { cleanRiskWarnings, RISK_WARNING_RULES, riskWarningsOutput } from "@/platform/ai/rules";
import type { StyleProfileValues } from "@/modules/style-profiles/constants";
import { THREADS_PARTS_MAX, THREADS_POST_MAX } from "@/modules/content-sets/constants";
import { stripUrls, threadsPayloadSchema } from "@/modules/content-sets/schema";

// Schema nội dung ở `content-sets/schema.ts` (dùng chung với form client); xuất lại ở đây cho `suggestions/actions.ts`
// (ngoại lệ AD-9 chỉ mở `prompts/` và `service.ts`).
export { threadsApprovalSchema, threadsPayloadSchema } from "@/modules/content-sets/schema";

// Bài Threads của Bộ nội dung (FR-14; spine AD-19): gợi ý `THREADS_POST`, Duyệt thì upsert `SocialPost` (THREADS).
// Viết riêng cho Threads theo Hồ sơ phong cách Threads, không cần Bài web trước; thân bài không có link — Link
// affiliate nằm ở Bình luận kèm link (gợi ý `LINK_COMMENT` riêng). Thay `toThreads` của `lib/ai.ts` cũ ([NO-10]).

export type SocialPostInput = {
  source: string;
  productNames: string[];
  angle: string | null;
  audience: string | null;
  instruction: string | null;
};

const threadsOutputSchema = z.object({ posts: z.array(z.string()), riskWarnings: riskWarningsOutput });

export type ThreadsOutput = z.infer<typeof threadsOutputSchema>;

// Dòng mô tả chung cho prompt bài mạng xã hội (Threads, Facebook).
export function socialUserPrompt(input: SocialPostInput) {
  return `Sản phẩm: ${input.productNames.join("; ")}
Góc viết: ${input.angle ?? "(tự chọn góc phù hợp nhất với dữ liệu)"}
Người đọc mục tiêu: ${input.audience ?? "(người đọc chung của trang)"}

Dữ liệu nguồn (chỉ dùng thông tin có ở đây, không bịa thêm):
${input.source}
${input.instruction ? `\nChỉ dẫn khi viết lại: ${input.instruction}` : ""}`;
}

export const threadsPostPrompt: PromptDef<SocialPostInput, typeof threadsOutputSchema, StyleProfileValues> = {
  id: "content-sets.threads-post",
  version: 2,
  profile: "fast",
  output: threadsOutputSchema,
  system: (style) => `Bạn viết bài Threads (chuỗi bài ngắn) cho trang "Mẹo Vặt Cuộc Sống" theo Hồ sơ phong cách Threads:
- Giọng văn: ${style.voice}
- Chuỗi ${style.partsMin ?? 4}–${style.partsMax ?? 7} bài; mỗi bài khoảng ${style.lengthMin}–${style.lengthMax} ký tự, tuyệt đối không quá ${THREADS_POST_MAX} ký tự.
- Emoji: ${style.emoji}
- Điều cấm: ${style.forbidden}
- Nội quy và quy chuẩn: ${style.rules}
- "posts" là các bài theo thứ tự đăng; không chèn link hay đường dẫn nào (link đặt ở bình luận riêng).
${RISK_WARNING_RULES}`,
  user: socialUserPrompt,
};

// Kết quả AI → payload: bỏ URL, bỏ bài trống, tối đa `THREADS_PARTS_MAX` bài (bài dài giữ nguyên để Vinh thấy và
// sửa); không còn bài nào → lỗi để gợi ý `FAILED`.
export function toThreadsPayload(out: ThreadsOutput) {
  const posts = out.posts.map(stripUrls).filter(Boolean).slice(0, THREADS_PARTS_MAX);
  if (posts.length === 0) throw new UserError("AI không trả bài Threads nào");
  return { payload: threadsPayloadSchema.parse({ posts }), riskWarnings: cleanRiskWarnings(out.riskWarnings) };
}
