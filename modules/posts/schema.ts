import { z } from "zod";
import { PostType, Status } from "@/generated/prisma/enums";
import { searchTerms } from "@/platform/search-text";
import { imageUrl, optionalText, requiredText, slugField } from "@/platform/validation/fields";
import {
  POST_CONTENT_MAX,
  POST_EXCERPT_MAX,
  POST_PRODUCTS_MAX,
  POST_SEO_DESCRIPTION_MAX,
  POST_SEO_TITLE_MAX,
  POST_SLUG_MAX,
  POST_TAG_MAX,
  POST_TAGS_MAX,
  POST_TITLE_MAX,
  SEARCH_QUERY_MAX,
  SEARCH_QUERY_MIN,
  SEARCH_TERMS_MAX,
} from "@/modules/posts/constants";

const postId = z.string().min(1, "Thiếu Bài web");

const limitedText = (max: number) => optionalText.pipe(z.string().max(max, `Tối đa ${max} ký tự`).nullable());

// Danh mục (model `Category`) chọn từ danh sách; "" (chưa chọn) → null. Id không còn tồn tại do service báo (FK).
const categoryId = z
  .string()
  .trim()
  .refine((s) => !s || z.uuid().safeParse(s).success, "Danh mục không hợp lệ")
  .transform((s) => s || null);

// Đường dẫn bài: để trống → server tạo từ tiêu đề (không trùng bài khác); có nhập thì kiểm dạng.
const slugRule = slugField(POST_SLUG_MAX);
const slug = z
  .string()
  .trim()
  .superRefine((s, ctx) => {
    const r = s ? slugRule.safeParse(s) : null;
    if (r && !r.success) ctx.addIssue({ code: "custom", message: r.error.issues[0].message });
  });

// Danh sách cách nhau bằng dấu phẩy (thẻ, từ khoá SEO) → mảng không trùng, bỏ mục trống. Lỗi gắn vào chính trường.
const commaList = (label: string) =>
  z.string().transform((s, ctx) => {
    // Bỏ trùng không phân biệt hoa thường, giữ cách viết lần đầu.
    const seen = new Set<string>();
    const items = s
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase()));
    if (items.length > POST_TAGS_MAX) {
      ctx.addIssue({ code: "custom", message: `Tối đa ${POST_TAGS_MAX} ${label}` });
      return z.NEVER;
    }
    const long = items.find((x) => x.length > POST_TAG_MAX);
    if (long) {
      ctx.addIssue({ code: "custom", message: `Mỗi ${label} tối đa ${POST_TAG_MAX} ký tự` });
      return z.NEVER;
    }
    return items;
  });

// Sản phẩm gắn vào bài, theo thứ tự hiện trên trang bài (`PostProduct.sortOrder`).
const productIds = z
  .array(z.string().min(1))
  .max(POST_PRODUCTS_MAX, `Tối đa ${POST_PRODUCTS_MAX} Sản phẩm mỗi bài`)
  .refine((ids) => new Set(ids).size === ids.length, "Sản phẩm bị gắn trùng");

const postFields = {
  title: requiredText(POST_TITLE_MAX, "Nhập tiêu đề"),
  slug,
  excerpt: limitedText(POST_EXCERPT_MAX),
  featuredImage: imageUrl,
  postType: z.enum(PostType, "Chọn Loại bài"),
  categoryId,
  content: z.string().max(POST_CONTENT_MAX, "Nội dung quá dài"),
  tags: commaList("thẻ"),
  seoTitle: limitedText(POST_SEO_TITLE_MAX),
  seoDescription: limitedText(POST_SEO_DESCRIPTION_MAX),
  seoKeywords: commaList("từ khoá"),
};

// Sửa Bài web (form `/cms/bai-viet/[id]`, action `savePost`). HTML thân bài sanitize ở service (AD-22).
export const postInputSchema = z.object({ id: postId, ...postFields, productIds });

// Bản nháp mới (action `createPostDraft`): cùng luật trường, chưa có id và Sản phẩm.
export const postDraftInputSchema = z.object(postFields);

// Tạo bài mới bằng tay (`/cms/bai-viet/moi`): bản nháp trống, chủ đề làm tiêu đề.
export const newPostInputSchema = z.object({
  postType: z.enum(PostType, "Chọn Loại bài"),
  categoryId,
  topic: z.string().trim().max(POST_TITLE_MAX, `Tối đa ${POST_TITLE_MAX} ký tự`),
});

// Chấm SEO (`checkPostSeo`): giá trị form lúc bấm, chưa lưu. Chỉ giới hạn độ dài để không gửi khối chữ vô hạn cho AI.
export const seoCheckInputSchema = z.object({
  title: z.string().max(POST_TITLE_MAX, `Tối đa ${POST_TITLE_MAX} ký tự`),
  seoTitle: z.string().max(POST_SEO_TITLE_MAX, `Tối đa ${POST_SEO_TITLE_MAX} ký tự`),
  seoDescription: z.string().max(POST_SEO_DESCRIPTION_MAX, `Tối đa ${POST_SEO_DESCRIPTION_MAX} ký tự`),
  content: z.string().max(POST_CONTENT_MAX, "Nội dung quá dài"),
  keywords: z.array(z.string().max(POST_TAG_MAX)).max(POST_TAGS_MAX),
});

export const setPostStatusInputSchema = z.object({ id: postId, status: z.enum(Status) });

export const deletePostInputSchema = z.object({ id: postId });

// Giá trị form (trường tuỳ chọn là "", thẻ và từ khoá là chuỗi cách nhau bằng dấu phẩy) và dữ liệu đã parse.
export type PostFormValues = z.input<typeof postInputSchema>;
export type PostInput = z.infer<typeof postInputSchema>;
export type NewPostFormValues = z.input<typeof newPostInputSchema>;
export type PostDraftFormValues = z.input<typeof postDraftInputSchema>;
export type SeoCheckInput = z.input<typeof seoCheckInputSchema>;

// Tìm Bài web (`searchPosts`, FR-36): từ khoá sau khi gấp không dấu còn ít nhất `SEARCH_QUERY_MIN` ký tự, tối đa
// `SEARCH_TERMS_MAX` từ (từ thừa bị bỏ). Trả về các từ đã gấp (`searchTerms`).
export const searchPostsInputSchema = z.object({
  q: z
    .string()
    .max(SEARCH_QUERY_MAX)
    .transform((q) => searchTerms(q).slice(0, SEARCH_TERMS_MAX))
    .refine((terms) => terms.join(" ").length >= SEARCH_QUERY_MIN),
});
