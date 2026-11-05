import { z } from "zod";
import { imageUrl, optionalText } from "@/platform/validation/fields";

// Sản phẩm không còn nhập qua bài: Kho Sản phẩm là nguồn duy nhất (`modules/products/schema.ts`);
// gắn Sản phẩm vào bài là Epic 3.
export const postInputSchema = z.object({
  title: z.string().trim().min(1, "Thiếu tiêu đề"),
  slug: z.string().trim(),
  excerpt: optionalText.refine((s) => !s || s.length <= 500, "Tóm tắt tối đa 500 ký tự"),
  featuredImage: imageUrl,
  category: z.enum(["MEO_VAT", "GOM_LINK"]),
  content: z.string(),
  tags: z.array(z.string().trim().min(1)),
  seoTitle: optionalText,
  seoDescription: optionalText,
  seoKeywords: z.array(z.string().trim().min(1)),
});

export type PostInput = z.input<typeof postInputSchema>;

export const newPostSchema = z.object({
  category: z.enum(["MEO_VAT", "GOM_LINK"]),
  topic: z.string().trim(),
  useAi: z.boolean(),
});
export type NewPostInput = z.input<typeof newPostSchema>;
