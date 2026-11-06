import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";

// Chuỗi Threads từ một Bài web (action `content-sets.runThreads`). Chuyển nguyên từ `toThreads` của `lib/ai.ts` cũ
// (Story 4.1); bài cuối còn chứa link website — trái FR-14 ([NO-10]), Epic 5 thay bằng gợi ý `THREADS_POST`
// + `LINK_COMMENT` theo Hồ sơ phong cách.

export type ThreadsPostInput = { title: string; content: string; url: string };

const threadsSchema = z.object({ posts: z.array(z.string()) });

export const threadsPostPrompt: PromptDef<ThreadsPostInput, typeof threadsSchema> = {
  id: "content-sets.threads-post",
  version: 1,
  profile: "fast",
  output: threadsSchema,
  system: () => `Bạn là chuyên gia viết chuỗi bài Threads/Facebook kéo người đọc về website.
- Chia thành 4–7 bài trong chuỗi, mỗi bài dưới 250 ký tự, câu ngắn, có emoji làm điểm nhấn vừa phải.
- Bài 1 là "hook" gây tò mò. Các bài giữa đưa giá trị thật (mẹo/điểm hay), không tiết lộ hết.
- Bài cuối là lời kêu gọi đọc chi tiết, chứa nguyên văn đường link được cung cấp.
- Giọng gần gũi Gen-Z, không giật tít sai sự thật.`,
  user: (input) => `Tiêu đề: ${input.title}
Link bài viết: ${input.url}
Nội dung (HTML):
${input.content}`,
};
