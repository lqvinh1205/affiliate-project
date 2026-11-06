"use client";

import { useId, type ReactNode } from "react";
import { Controller, useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { inspirationResearchSchema } from "@/modules/research/prompts/research-inspiration.prompt";
import type { InspirationResearchFormValues } from "@/modules/research/schema";
import type { InspirationResearchData } from "@/modules/research/types";
import { callAction } from "@/components/shared/call-action";
import { CopyButton } from "@/components/shared/copy-button.client";
import { UnsavedChangesGuard } from "@/components/shared/unsaved-changes-guard.client";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Values = InspirationResearchFormValues;

function TextField({
  control,
  name,
  label,
  multiline = false,
  after,
}: {
  control: Control<Values>;
  name: FieldPath<Values>;
  label: string;
  multiline?: boolean;
  after?: ReactNode;
}) {
  const id = useId();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const props = {
          id,
          "aria-invalid": fieldState.invalid,
          name: field.name,
          ref: field.ref,
          onBlur: field.onBlur,
          onChange: field.onChange,
          value: typeof field.value === "string" ? field.value : "",
        };
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id} className="text-body-sm text-on-surface-variant">
              {label}
            </FieldLabel>
            <div className="flex items-start gap-space-sm">
              {multiline ? <Textarea rows={2} {...props} /> : <Input autoComplete="off" {...props} />}
              {after}
            </div>
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

// Nút chép một từ khoá theo giá trị đang sửa (UJ-2 bước 3: chép từ khoá, tìm trên Shopee).
function CopyKeyword({ control, index }: { control: Control<Values>; index: number }) {
  const text = useWatch({ control, name: `keywords.${index}.text` });
  return <CopyButton text={text ?? ""} label={`Sao chép từ khoá ${index + 1}`} />;
}

// Form Hồ sơ nghiên cứu của Cảm hứng (FR-2, UX-DR77): Tóm tắt, Từ khoá tìm trên Shopee (mỗi ô có nút Sao chép), Dàn ý
// bài mẹo. Dùng cho cả Duyệt gợi ý `RESEARCH` của Cảm hứng và sửa hồ sơ đã Duyệt — nơi dùng truyền `action`. Sửa nội
// dung từng ý, không thêm/xoá (muốn đổi nhiều thì Tạo lại kèm chỉ dẫn). Chỉ đọc `defaultValues` lúc mount (AD-12);
// validate tại trường bằng cùng `inspirationResearchSchema` với server (AD-14); lỗi server → Toast.
export function InspirationResearchForm({
  defaultValues,
  action,
  submitLabel,
  pendingLabel,
  successMessage,
  onSaved,
  extraActions,
}: {
  defaultValues: InspirationResearchData;
  action: (values: Values) => Promise<Result<object>>;
  submitLabel: string;
  pendingLabel: string;
  successMessage: string;
  onSaved?: () => void;
  extraActions?: ReactNode;
}) {
  const form = useForm({
    resolver: zodResolver(inspirationResearchSchema),
    defaultValues: { ...defaultValues, summary: defaultValues.summary ?? "" },
  });
  const { control, formState } = form;
  const { isDirty, isSubmitting } = formState;

  const onSubmit = form.handleSubmit(async () => {
    const values = form.getValues();
    const res = await callAction(() => action(values));
    if (!res.ok) return void toast.error(res.error);
    form.reset(values);
    toast.success(successMessage);
    onSaved?.();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-space-lg">
      <UnsavedChangesGuard when={isDirty && !isSubmitting} />

      <TextField control={control} name="summary" label="Cảm hứng nói về" multiline />

      <fieldset className="space-y-space-sm">
        <legend className="mb-space-sm text-label-md">Từ khoá tìm trên Shopee</legend>
        {defaultValues.keywords.map((k, i) => (
          <TextField
            key={k.id}
            control={control}
            name={`keywords.${i}.text`}
            label={`Từ khoá ${i + 1}`}
            after={<CopyKeyword control={control} index={i} />}
          />
        ))}
      </fieldset>

      <fieldset className="space-y-space-sm">
        <legend className="mb-space-sm text-label-md">Dàn ý bài mẹo</legend>
        {defaultValues.outline.map((o, i) => (
          <div key={o.id} className="space-y-space-sm rounded-lg border p-space-sm">
            <TextField control={control} name={`outline.${i}.heading`} label={`Mục ${i + 1}`} />
            <TextField control={control} name={`outline.${i}.detail`} label="Viết gì" multiline />
          </div>
        ))}
      </fieldset>

      <div className="flex flex-col gap-space-sm lg:flex-row-reverse lg:justify-start">
        <Button type="submit" size="lg" className="w-full lg:w-auto" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? pendingLabel : submitLabel}
        </Button>
        {extraActions && <div className="grid grid-cols-2 gap-space-sm lg:flex">{extraActions}</div>}
      </div>
    </form>
  );
}
