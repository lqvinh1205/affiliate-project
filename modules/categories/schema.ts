import { z } from "zod";
import { RESERVED_ROOT_SLUGS, slugify } from "@/platform/slug";
import { optionalText, requiredText, slugField } from "@/platform/validation/fields";
import { CATEGORY_DESCRIPTION_MAX, CATEGORY_NAME_MAX, CATEGORY_SLUG_MAX } from "@/modules/categories/constants";

const categoryId = z.string().min(1, "Thiếu Danh mục");

const description = optionalText.pipe(
  z.string().max(CATEGORY_DESCRIPTION_MAX, `Tối đa ${CATEGORY_DESCRIPTION_MAX} ký tự`).nullable(),
);

// Đường dẫn để trống → tạo từ tên; kiểm dạng và đường dẫn hệ thống sau khi đã có giá trị cuối,
// lỗi vẫn gắn vào trường `slug` (spine AD-14, AD-20).
export const categoryInputSchema = z
  .object({
    id: categoryId.optional(),
    name: requiredText(CATEGORY_NAME_MAX, "Nhập tên Danh mục"),
    slug: z.string().trim(),
    description,
  })
  .transform((v) => ({ ...v, slug: v.slug || slugify(v.name) }))
  .pipe(
    z.object({
      id: categoryId.optional(),
      name: z.string(),
      slug: slugField(CATEGORY_SLUG_MAX).refine(
        (s) => !RESERVED_ROOT_SLUGS.includes(s),
        "Đường dẫn này đã dành cho hệ thống",
      ),
      description: z.string().nullable(),
    }),
  );

export const deleteCategoryInputSchema = z.object({ id: categoryId });

export const moveCategoryInputSchema = z.object({ id: categoryId, direction: z.enum(["up", "down"]) });

// Giá trị form (trường tuỳ chọn là "" — Consistency Conventions) và dữ liệu đã parse.
export type CategoryFormValues = z.input<typeof categoryInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type MoveDirection = z.infer<typeof moveCategoryInputSchema>["direction"];
