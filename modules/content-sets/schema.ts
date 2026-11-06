import { z } from "zod";
import { POST_CONTENT_MAX, POST_SLUG_MAX, POST_TITLE_MAX } from "@/modules/posts/constants";

// Chuỗi Threads từ Bài web đang soạn (`runThreads`, tạm tới Epic 5): giá trị form lúc bấm.
export const threadsInputSchema = z.object({
  title: z.string().trim().min(1, "Nhập tiêu đề trước").max(POST_TITLE_MAX, `Tối đa ${POST_TITLE_MAX} ký tự`),
  content: z.string().max(POST_CONTENT_MAX, "Nội dung quá dài"),
  slug: z.string().trim().max(POST_SLUG_MAX),
});

export type ThreadsInput = z.input<typeof threadsInputSchema>;
