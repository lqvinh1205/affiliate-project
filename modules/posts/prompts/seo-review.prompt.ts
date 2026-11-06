import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";

// Chấm điểm SEO on-page (FR-13; ngoại lệ AD-9: `posts.checkPostSeo` trả báo cáo, không lưu, không qua Duyệt).
// Chuyển từ `analyzeSeo` của `lib/ai.ts` cũ (Story 4.1).

export type SeoReviewInput = {
  title: string;
  seoTitle: string;
  seoDescription: string;
  content: string;
  keywords: string[];
};

const seoReportSchema = z.object({
  score: z.number(),
  suggestions: z.array(z.string()),
});

export const seoReviewPrompt: PromptDef<SeoReviewInput, typeof seoReportSchema> = {
  id: "posts.seo-review",
  version: 1,
  profile: "fast",
  output: seoReportSchema,
  system: () =>
    `Bạn là chuyên gia SEO on-page cho website tiếng Việt. Chấm bài viết trên thang 0–100 dựa trên:
từ khoá ở tiêu đề/đoạn đầu/heading, độ dài và cấu trúc heading, meta title (≤ 60 ký tự) và meta description (140–160 ký tự),
độ dễ đọc, tính hữu ích và trải nghiệm người đọc. Trả về "suggestions" là 3–6 gợi ý cụ thể, làm được ngay.`,
  user: (input) => `Từ khoá mục tiêu: ${input.keywords.join(", ") || "(chưa có)"}
Tiêu đề: ${input.title}
Meta title: ${input.seoTitle || "(trống)"}
Meta description: ${input.seoDescription || "(trống)"}
Nội dung (HTML):
${input.content}`,
};
