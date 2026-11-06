"use client";

import { useId } from "react";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveStyleProfile } from "@/modules/style-profiles/actions";
import { STYLE_HARD_LIMITS, STYLE_PLATFORMS } from "@/modules/style-profiles/constants";
import {
  styleProfileInputSchema,
  type StyleProfileFormValues,
  type StyleProfileInput,
} from "@/modules/style-profiles/schema";
import type { StyleProfileView } from "@/modules/style-profiles/types";
import { callAction } from "@/components/shared/call-action";
import { UnsavedChangesGuard } from "@/components/shared/unsaved-changes-guard.client";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Values = StyleProfileFormValues;

// Giá trị form từ hồ sơ: số → chuỗi, null → "" (AD-14: trường tuỳ chọn là "" trong form).
function toFormValues(p: StyleProfileView): Values {
  const n = (v: number | null) => (v === null ? "" : String(v));
  return {
    platform: p.platform,
    voice: p.voice,
    lengthMin: n(p.lengthMin),
    lengthMax: n(p.lengthMax),
    partsMin: n(p.partsMin),
    partsMax: n(p.partsMax),
    emoji: p.emoji,
    forbidden: p.forbidden,
    rules: p.rules,
    disclosure: p.disclosure ?? "",
  };
}

function TextField({
  control,
  name,
  label,
  hint,
  multiline,
  inputMode,
}: {
  control: Control<Values, unknown, StyleProfileInput>;
  name: FieldPath<Values>;
  label: string;
  hint?: string;
  multiline?: boolean;
  inputMode?: "numeric";
}) {
  const id = useId();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {multiline ? (
            <Textarea id={id} rows={3} aria-invalid={fieldState.invalid} {...field} value={field.value ?? ""} />
          ) : (
            <Input
              id={id}
              autoComplete="off"
              inputMode={inputMode}
              aria-invalid={fieldState.invalid}
              {...field}
              value={field.value ?? ""}
            />
          )}
          {hint && <FieldDescription>{hint}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

// Form một Hồ sơ phong cách (UX-DR81, FR-18): giọng văn, độ dài, (số bài/mục), emoji, điều cấm, nội quy, (câu công
// khai). Lỗi tại trường bằng cùng `styleProfileInputSchema` với server (AD-14) — vượt giới hạn cứng nêu giới hạn.
// Ba form trên cùng màn nên mỗi form có nút Lưu riêng, không dính đáy.
export function StyleProfileForm({ profile }: { profile: StyleProfileView }) {
  const meta = STYLE_PLATFORMS[profile.platform];
  const hard = STYLE_HARD_LIMITS[profile.platform];
  const form = useForm({ resolver: zodResolver(styleProfileInputSchema), defaultValues: toFormValues(profile) });
  const { control, formState } = form;

  const onSubmit = form.handleSubmit(async () => {
    const values = form.getValues();
    const res = await callAction(() => saveStyleProfile(values));
    if (!res.ok) return void toast.error(res.error);
    form.reset(values);
    toast.success("Đã lưu — áp dụng cho nội dung tạo từ giờ");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-space-lg">
      <UnsavedChangesGuard when={formState.isDirty && !formState.isSubmitting} />
      <TextField control={control} name="voice" label="Giọng văn" multiline />
      <fieldset className="space-y-space-sm">
        <legend className="mb-space-sm text-label-md">
          {meta.length.label} ({meta.length.unit})
        </legend>
        <div className="grid grid-cols-2 gap-space-sm">
          <TextField control={control} name="lengthMin" label="Tối thiểu" inputMode="numeric" />
          <TextField
            control={control}
            name="lengthMax"
            label="Tối đa"
            inputMode="numeric"
            hint={`Giới hạn cứng ${hard.lengthMax} ${meta.length.unit}`}
          />
        </div>
      </fieldset>
      {meta.parts && (
        <fieldset className="space-y-space-sm">
          <legend className="mb-space-sm text-label-md">
            {meta.parts.label} ({meta.parts.unit})
          </legend>
          <div className="grid grid-cols-2 gap-space-sm">
            <TextField control={control} name="partsMin" label="Tối thiểu" inputMode="numeric" />
            <TextField
              control={control}
              name="partsMax"
              label="Tối đa"
              inputMode="numeric"
              hint={hard.partsMax ? `Giới hạn cứng ${hard.partsMax} ${meta.parts.unit}` : undefined}
            />
          </div>
        </fieldset>
      )}
      <TextField control={control} name="emoji" label="Emoji" multiline />
      <TextField control={control} name="forbidden" label="Điều cấm" multiline />
      <TextField control={control} name="rules" label="Nội quy và quy chuẩn" multiline />
      {meta.disclosure && (
        <TextField
          control={control}
          name="disclosure"
          label="Câu công khai (tuỳ chọn)"
          hint="Điền thì AI chèn câu này vào Bình luận kèm link. Để trống thì không chèn."
        />
      )}
      <Button type="submit" size="lg" className="w-full lg:w-auto" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {formState.isSubmitting ? "Đang lưu…" : `Lưu hồ sơ ${meta.label}`}
      </Button>
    </form>
  );
}
