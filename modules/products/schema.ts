import { z } from "zod";
import { imageUrl, optionalText, requiredText, shopeeAffiliateUrl } from "@/platform/validation/fields";
import {
  PRODUCT_NAME_MAX,
  PRODUCT_PRICE_TEXT_MAX,
  PRODUCT_RAW_IMAGE_URLS_MAX,
  PRODUCT_RAW_TEXT_MAX,
} from "@/modules/products/constants";

const productId = z.string().min(1, "Thiếu Sản phẩm");

const limitedText = (max: number) =>
  optionalText.pipe(z.string().max(max, `Tối đa ${max} ký tự`).nullable());

// Danh mục chọn từ danh sách; "" (chưa chọn) → null. Id không còn tồn tại do service báo (FK).
const categoryId = z
  .string()
  .trim()
  .refine((s) => !s || z.uuid().safeParse(s).success, "Danh mục không hợp lệ")
  .transform((s) => s || null);

// URL ảnh thô: một dòng một URL, bỏ dòng trống; mỗi dòng phải qua cùng luật `imageUrl` (host trong platform/images.ts).
// "Dòng N" đếm theo dòng người dùng thấy trong ô (kể cả dòng trống).
const rawImageUrls = z.string().transform((s, ctx) => {
  const lines = s
    .split("\n")
    .map((text, i) => ({ text: text.trim(), lineNo: i + 1 }))
    .filter((l) => l.text);
  if (lines.length > PRODUCT_RAW_IMAGE_URLS_MAX) {
    ctx.addIssue({ code: "custom", message: `Tối đa ${PRODUCT_RAW_IMAGE_URLS_MAX} ảnh` });
    return z.NEVER;
  }
  for (const { text, lineNo } of lines) {
    const r = imageUrl.safeParse(text);
    if (!r.success) {
      ctx.addIssue({ code: "custom", message: `Dòng ${lineNo}: ${r.error.issues[0].message}` });
      return z.NEVER;
    }
  }
  return lines.map((l) => l.text);
});

export const productInputSchema = z.object({
  id: productId.optional(),
  name: requiredText(PRODUCT_NAME_MAX, "Nhập tên Sản phẩm"),
  affiliateUrl: z.string().trim().min(1, "Nhập Link affiliate").pipe(shopeeAffiliateUrl),
  image: imageUrl,
  priceText: limitedText(PRODUCT_PRICE_TEXT_MAX),
  categoryId,
  rawText: limitedText(PRODUCT_RAW_TEXT_MAX),
  rawReviews: limitedText(PRODUCT_RAW_TEXT_MAX),
  rawImageUrls,
});

// Ẩn/hiện một chạm (FR-5); "Hoàn tác" gọi lại với giá trị ngược.
export const setProductHiddenInputSchema = z.object({ id: productId, hidden: z.boolean() });

// Giá trị form (trường tuỳ chọn là "", URL ảnh thô là chuỗi nhiều dòng) và dữ liệu đã parse.
export type ProductFormValues = z.input<typeof productInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
