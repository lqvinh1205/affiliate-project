"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Result } from "@/platform/errors";
import type { CategoryOption } from "@/modules/categories/types";
import { CategorySelect } from "@/modules/categories/components/category-select";
import { POST_TITLE_MAX } from "@/modules/posts/constants";
import { newPostInputSchema, type NewPostFormValues } from "@/modules/posts/schema";
import { PostTypePicker } from "@/modules/posts/components/post-type-picker.client";
import { CmsForm } from "@/components/shared/cms-form.client";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

// Tạo Bài web mới bằng tay (`/cms/bai-viet/moi`, AD-14): React Hook Form + cùng `newPostInputSchema` với server, qua
// CmsForm (lỗi tại trường, nút dính đáy, UnsavedChangesGuard). Bản nháp trống, chủ đề làm tiêu đề; xong chuyển sang
// trình soạn. Bài do AI viết tạo từ Bộ nội dung (Chi tiết Sản phẩm → "Tạo bộ nội dung"). `createPost` do Screen
// truyền vào.
export function NewPostForm({
  categories,
  createPost,
}: {
  categories: CategoryOption[];
  createPost: (input: NewPostFormValues) => Promise<Result<{ id: string }>>;
}) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(newPostInputSchema),
    defaultValues: { postType: "GOM_LINK", categoryId: "", topic: "" } satisfies NewPostFormValues,
  });

  return (
    <CmsForm
      form={form}
      action={createPost}
      submitLabel="Tạo bản nháp"
      pendingLabel="Đang tạo…"
      successMessage="Đã tạo bản nháp"
      onSaved={(res) => router.push(`/cms/bai-viet/${res.id}`)}
    >
      <Controller
        name="postType"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel id="new-post-type-label">Loại bài</FieldLabel>
            <PostTypePicker value={field.value} onChange={field.onChange} labelledBy="new-post-type-label" />
          </Field>
        )}
      />
      <Controller
        name="categoryId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="new-post-category">Danh mục</FieldLabel>
            <CategorySelect id="new-post-category" options={categories} aria-invalid={fieldState.invalid} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="topic"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="new-post-topic">
              Tiêu đề tạm ({field.value.length}/{POST_TITLE_MAX})
            </FieldLabel>
            <Textarea
              id="new-post-topic"
              rows={3}
              placeholder="VD: Đồ decor phòng trọ dưới 100k cho sinh viên"
              aria-invalid={fieldState.invalid}
              aria-describedby="new-post-topic-hint"
              {...field}
            />
            <FieldDescription id="new-post-topic-hint">
              Không bắt buộc; trống thì “Bài viết mới”. Muốn AI viết bài: mở Sản phẩm đã có hồ sơ nghiên cứu, chọn
              “Tạo bộ nội dung”.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </CmsForm>
  );
}
