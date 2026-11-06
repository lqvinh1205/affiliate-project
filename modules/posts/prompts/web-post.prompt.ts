import { z } from "zod";
import type { PostType } from "@/generated/prisma/enums";
import type { PromptDef } from "@/platform/ai/ask";
import { POST_TYPES } from "@/modules/posts/constants";

// AI viết bản nháp Bài web theo chủ đề (action `posts.createPost`, nhánh AI). Chuyển nguyên từ `generatePost` của
// `lib/ai.ts` cũ (Story 4.1); Epic 5 thay bằng gợi ý `WEB_POST` theo Hồ sơ phong cách (AD-19, AD-25).

export type WebPostInput = { postType: PostType; topic: string };

const webPostSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  seoKeywords: z.array(z.string()),
});

export const webPostPrompt: PromptDef<WebPostInput, typeof webPostSchema> = {
  id: "posts.web-post",
  version: 1,
  profile: "quality",
  output: webPostSchema,
  system: () => `Bạn là biên tập viên của trang "Mẹo Vặt Cuộc Sống" — tạp chí đời sống cho người Việt.
Văn phong: gần gũi, dí dỏm vừa phải kiểu Gen-Z nhưng rõ ràng, hữu ích, không sến, không phóng đại.
Quy tắc riêng của Bài web:
- "content" là HTML chỉ dùng các thẻ: h2, h3, p, ul, ol, li, strong, em, blockquote. Không dùng h1, không chèn link, ảnh hay giá — sản phẩm được hiển thị riêng bên dưới bài.
- Dài khoảng 600–900 từ, 3–5 mục h2, mở bài 1–2 đoạn ngắn đi thẳng vào vấn đề.
- "title" ≤ 70 ký tự, hấp dẫn nhưng không giật tít; "seoTitle" ≤ 60 ký tự; "seoDescription" 140–160 ký tự; "excerpt" 1–2 câu (≤ 200 ký tự).
- "tags": 3–5 tag ngắn viết thường; "seoKeywords": 3–6 cụm từ khoá người Việt hay tìm.`,
  user: (input) => {
    const kind =
      input.postType === "MEO_VAT"
        ? "bài MẸO VẶT: trọng tâm là cách làm/mẹo thực tế từng bước"
        : "bài GOM LINK: tổng hợp/review ngắn, mỗi mục một h2 hoặc h3 nêu điểm hay và hợp với ai";
    return `Loại bài: ${POST_TYPES[input.postType].label}. Hãy viết ${kind}.
Chủ đề/ý tưởng: ${input.topic}
Bài này chưa gắn sản phẩm: không nhắc tên sản phẩm cụ thể.`;
  },
};
