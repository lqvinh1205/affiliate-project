"use client";

import { useId, type ReactNode } from "react";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { REVIEW_SUMMARY_LABELS } from "@/modules/research/constants";
import { researchProfileSchema } from "@/modules/research/prompts/research-product.prompt";
import type { ResearchProfileFormValues } from "@/modules/research/schema";
import type { ResearchProfileData } from "@/modules/research/types";
import { callAction } from "@/components/shared/call-action";
import { UnsavedChangesGuard } from "@/components/shared/unsaved-changes-guard.client";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Values = ResearchProfileFormValues;

// Giá trị form từ dữ liệu hồ sơ: chữ tuỳ chọn `null` → "" (ô nhập không nhận null).
export function toResearchFormValues(data: ResearchProfileData): Values {
  return { ...data, infoNote: data.infoNote ?? "", imageDescription: data.imageDescription ?? "" };
}

function TextField({
  control,
  name,
  label,
  multiline = false,
  rows,
}: {
  control: Control<Values>;
  name: FieldPath<Values>;
  label: string;
  multiline?: boolean;
  rows?: number;
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
            {multiline ? <Textarea rows={rows ?? 2} {...props} /> : <Input autoComplete="off" {...props} />}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-space-sm">
      <legend className="mb-space-sm text-label-md">{title}</legend>
      {children}
    </fieldset>
  );
}

// Form Hồ sơ nghiên cứu (UX-DR45): Thông tin (kèm link nguồn), Mô tả ảnh, Khen / Chê / Phù hợp, Người đọc mục tiêu,
// Góc viết. Dùng cho cả Duyệt gợi ý `RESEARCH` (sửa rồi Duyệt) và sửa hồ sơ đã Duyệt — nơi dùng truyền `action`.
// Sửa nội dung từng ý, không thêm/xoá ý (muốn đổi nhiều thì Tạo lại kèm chỉ dẫn). Chỉ đọc `defaultValues` lúc mount
// (AD-12); validate tại trường bằng cùng `researchProfileSchema` với server (AD-14); lỗi server → Toast.
export function ResearchProfileForm({
  defaultValues,
  action,
  submitLabel,
  pendingLabel,
  successMessage,
  onSaved,
  extraActions,
  disabled = false,
}: {
  defaultValues: ResearchProfileData;
  action: (values: Values) => Promise<Result<object>>;
  submitLabel: string;
  pendingLabel: string;
  successMessage: string;
  onSaved?: () => void;
  extraActions?: ReactNode;
  disabled?: boolean;
}) {
  const form = useForm({ resolver: zodResolver(researchProfileSchema), defaultValues: toResearchFormValues(defaultValues) });
  const { control, formState } = form;
  const { isDirty, isSubmitting } = formState;
  const review = defaultValues.reviewSummary;

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

      <Section title="Thông tin">
        {defaultValues.info.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">Không tìm được thông tin công khai trên web.</p>
        )}
        {defaultValues.infoNote && <p className="text-body-sm text-on-surface-variant">{defaultValues.infoNote}</p>}
        {defaultValues.info.map((item, i) => (
          <div key={item.id} className="space-y-1">
            <TextField control={control} name={`info.${i}.text`} label={`Ý ${i + 1}`} multiline />
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex min-h-touch-target max-w-full items-center gap-1 text-body-sm break-all text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink className="size-4 shrink-0" aria-hidden />
                {hostOf(item.sourceUrl)}
                <span className="sr-only">(nguồn của ý {i + 1}, mở tab mới)</span>
              </a>
            )}
          </div>
        ))}
      </Section>

      <Section title="Mô tả ảnh">
        <TextField control={control} name="imageDescription" label="Hình dáng, màu, chất liệu, chữ trên bao bì" multiline rows={3} />
      </Section>

      <Section title="Khen / Chê / Phù hợp">
        {!review ? (
          <p className="text-body-sm text-on-surface-variant">Chưa có đánh giá dán vào Dữ liệu thô nên bỏ qua phần này.</p>
        ) : (
          (Object.keys(REVIEW_SUMMARY_LABELS) as (keyof typeof REVIEW_SUMMARY_LABELS)[]).map((key) => (
            <div key={key} className="space-y-space-sm">
              <p className="text-label-md">{REVIEW_SUMMARY_LABELS[key]}</p>
              {review[key].length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Đánh giá không nhắc tới.</p>
              ) : (
                review[key].map((_, i) => (
                  <TextField
                    key={i}
                    control={control}
                    name={`reviewSummary.${key}.${i}`}
                    label={`${REVIEW_SUMMARY_LABELS[key]} ${i + 1}`}
                    multiline
                  />
                ))
              )}
            </div>
          ))
        )}
      </Section>

      <Section title="Người đọc mục tiêu">
        {defaultValues.audiences.map((a, i) => (
          <div key={a.id} className="space-y-space-sm rounded-lg border p-space-sm">
            <TextField control={control} name={`audiences.${i}.name`} label={`Nhóm ${i + 1}`} />
            <TextField control={control} name={`audiences.${i}.reason`} label="Lý do" multiline />
          </div>
        ))}
      </Section>

      <Section title="Góc viết">
        {defaultValues.angles.map((a, i) => (
          <div key={a.id} className="space-y-space-sm rounded-lg border p-space-sm">
            <TextField control={control} name={`angles.${i}.name`} label={`Góc viết ${i + 1}`} />
            <TextField control={control} name={`angles.${i}.hook`} label="Câu mở đầu" multiline />
          </div>
        ))}
      </Section>

      <div className="flex flex-col gap-space-sm lg:flex-row-reverse lg:justify-start">
        <Button type="submit" size="lg" className="w-full lg:w-auto" disabled={isSubmitting || disabled}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? pendingLabel : submitLabel}
        </Button>
        {extraActions && <div className="grid grid-cols-2 gap-space-sm lg:flex">{extraActions}</div>}
      </div>
    </form>
  );
}
