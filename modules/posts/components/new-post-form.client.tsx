"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { cn } from "@/components/ui/lib/utils";

const MODES = [
  { useAi: true, label: "AI viết bản nháp", description: "Nhập chủ đề, AI viết để bạn duyệt trước khi đăng." },
  { useAi: false, label: "Bản nháp trống", description: "Tự viết; chủ đề làm tiêu đề." },
] as const;

// Tạo Bài web mới (`/cms/bai-viet/moi`, AD-14): React Hook Form + cùng `newPostInputSchema` với server, qua CmsForm
// (lỗi tại trường, nút dính đáy, UnsavedChangesGuard). AI viết bản nháp theo chủ đề hoặc bản nháp trống; xong chuyển
// sang trình soạn. `createPost` (`modules/posts/actions.ts`) do Screen truyền vào.
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
    defaultValues: { postType: "GOM_LINK", categoryId: "", topic: "", useAi: true } satisfies NewPostFormValues,
  });
  const useAi = useWatch({ control: form.control, name: "useAi" });

  return (
    <CmsForm
      form={form}
      action={createPost}
      submitLabel={useAi ? "AI viết bài" : "Tạo bản nháp"}
      pendingLabel={useAi ? "AI đang viết… (20–40 giây)" : "Đang tạo…"}
      successMessage="Đã tạo bản nháp"
      onSaved={(res) => router.push(`/cms/bai-viet/${res.id}`)}
    >
      <Controller
        name="useAi"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel id="new-post-mode-label">Cách tạo</FieldLabel>
            <div role="radiogroup" aria-labelledby="new-post-mode-label" className="grid grid-cols-2 gap-space-sm">
              {MODES.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  role="radio"
                  aria-checked={field.value === m.useAi}
                  onClick={() => field.onChange(m.useAi)}
                  className={cn(
                    "min-h-touch-target rounded-xl border px-space-sm py-space-sm text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary",
                    field.value === m.useAi ? "border-primary bg-surface-container-low ring-2 ring-primary/30" : "hover:border-outline",
                  )}
                >
                  <span className="block text-label-md">{m.label}</span>
                  <span className="block text-body-sm text-on-surface-variant">{m.description}</span>
                </button>
              ))}
            </div>
          </Field>
        )}
      />
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
              Chủ đề / ý tưởng ({field.value.length}/{POST_TITLE_MAX})
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
              Bắt buộc khi AI viết. Bản nháp trống lấy chủ đề làm tiêu đề (trống thì “Bài viết mới”).
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </CmsForm>
  );
}
