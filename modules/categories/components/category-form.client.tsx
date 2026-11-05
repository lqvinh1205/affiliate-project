"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { slugify } from "@/platform/slug";
import { saveCategory } from "@/modules/categories/actions";
import { CATEGORY_DESCRIPTION_MAX, CATEGORY_NAME_MAX, CATEGORY_SLUG_MAX } from "@/modules/categories/constants";
import { categoryInputSchema, type CategoryFormValues } from "@/modules/categories/schema";
import { CmsForm } from "@/components/shared/cms-form.client";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Form tạo/sửa Danh mục; chỉ đọc `defaultValues` lúc mount (AD-12). Tạo xong chuyển sang màn sửa.
export function CategoryForm({ defaultValues }: { defaultValues: CategoryFormValues }) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(categoryInputSchema), defaultValues });
  const name = useWatch({ control: form.control, name: "name" });

  return (
    <CmsForm
      form={form}
      action={saveCategory}
      onSaved={(saved, values) => {
        if (!values.id) {
          router.replace(`/cms/danh-muc/${saved.id}`);
          return;
        }
        // Đường dẫn để trống đã được server tạo từ tên: hiện lại giá trị đã lưu.
        if (!values.slug) form.reset({ ...values, slug: saved.slug });
      }}
    >
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="category-name">
              Tên ({field.value.length}/{CATEGORY_NAME_MAX})
            </FieldLabel>
            <Input id="category-name" autoComplete="off" aria-invalid={fieldState.invalid} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="slug"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="category-slug">Đường dẫn</FieldLabel>
            <Input
              id="category-slug"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={CATEGORY_SLUG_MAX}
              placeholder={slugify(name) || "do-bep"}
              aria-invalid={fieldState.invalid}
              aria-describedby="category-slug-hint"
              {...field}
            />
            <FieldDescription id="category-slug-hint">
              Chữ thường không dấu, số và dấu gạch ngang. Để trống thì tự tạo từ tên.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="category-description">
              Mô tả ({field.value.length}/{CATEGORY_DESCRIPTION_MAX})
            </FieldLabel>
            <Textarea
              id="category-description"
              rows={3}
              aria-invalid={fieldState.invalid}
              aria-describedby="category-description-hint"
              {...field}
            />
            <FieldDescription id="category-description-hint">
              Hiện trên trang Danh mục và làm mô tả cho Google. Không bắt buộc.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </CmsForm>
  );
}
