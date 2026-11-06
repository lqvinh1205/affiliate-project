"use server";

import { ask } from "@/platform/ai/ask";
import { run } from "@/platform/auth/run";
import { UserError, type Result } from "@/platform/errors";
import { SITE_URL } from "@/platform/site";
import { firstError } from "@/platform/validation/errors";
import { threadsPostPrompt } from "@/modules/content-sets/prompts/threads-post.prompt";
import { threadsInputSchema, type ThreadsInput } from "@/modules/content-sets/schema";

// Chuỗi Threads từ Bài web đang soạn: trả về để Vinh sao chép, không lưu. Chuyển từ `app/cms/actions.ts`
// (Story 4.1), hành vi giữ nguyên tới khi Epic 5 thay bằng gợi ý `THREADS_POST` + `LINK_COMMENT` (AD-9, AD-19).
export async function runThreads(input: ThreadsInput): Promise<Result<{ posts: string[] }>> {
  return run(async () => {
    const parsed = threadsInputSchema.safeParse(input);
    if (!parsed.success) throw new UserError(firstError(parsed.error));
    const { title, content, slug } = parsed.data;
    const { data } = await ask({
      prompt: threadsPostPrompt,
      input: { title, content, url: `${SITE_URL}/bai-viet/${slug}` },
    });
    const posts = data.posts.map((p) => p.trim()).filter(Boolean);
    if (posts.length === 0) throw new UserError("AI chưa viết được chuỗi Threads. Bấm tạo lại.");
    return { posts };
  });
}
