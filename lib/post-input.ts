import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/images";

const optionalText = z.string().trim().transform((s) => s || null);
const imageUrl = z
  .string()
  .trim()
  .refine((s) => !s || isAllowedImageUrl(s), "Ảnh phải là link https từ Shopee hoặc Supabase")
  .transform((s) => s || null);

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Thiếu tên sản phẩm"),
  image: imageUrl,
  price: optionalText,
  affiliateUrl: z.url({ protocol: /^https?$/, error: "Link affiliate không hợp lệ" }),
});

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
  products: z.array(productInputSchema),
});

export type ProductInput = z.input<typeof productInputSchema>;
export type PostInput = z.input<typeof postInputSchema>;

export const newPostSchema = z.object({
  category: z.enum(["MEO_VAT", "GOM_LINK"]),
  topic: z.string().trim(),
  products: z.array(productInputSchema),
  useAi: z.boolean(),
});
export type NewPostInput = z.input<typeof newPostSchema>;

export function firstError(e: z.ZodError) {
  return e.issues[0]?.message ?? "Dữ liệu không hợp lệ";
}
