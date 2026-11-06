"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveBioSettings } from "@/modules/bio/actions";
import { BIO_DISCLOSURE_MAX, BIO_INTRO_MAX } from "@/modules/bio/constants";
import { bioSettingsInputSchema, type BioSettingsFormValues } from "@/modules/bio/schema";
import { CmsForm } from "@/components/shared/cms-form.client";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

// Giới thiệu và câu chữ Nhãn công khai của `/bio` (FR-31, UX-DR80). Nhãn sửa được, không tắt được: schema bắt buộc
// có chữ. Chỉ đọc `defaultValues` lúc mount (AD-12).
export function BioSettingsForm({ defaultValues }: { defaultValues: BioSettingsFormValues }) {
  const form = useForm({ resolver: zodResolver(bioSettingsInputSchema), defaultValues });
  return (
    <CmsForm form={form} action={saveBioSettings}>
      <Controller
        name="intro"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="bio-intro">
              Giới thiệu ({field.value.length}/{BIO_INTRO_MAX})
            </FieldLabel>
            <Textarea id="bio-intro" rows={4} aria-invalid={fieldState.invalid} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="disclosure"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="bio-disclosure">
              Câu công khai affiliate ({field.value.length}/{BIO_DISCLOSURE_MAX})
            </FieldLabel>
            <Textarea
              id="bio-disclosure"
              rows={3}
              aria-invalid={fieldState.invalid}
              aria-describedby="bio-disclosure-hint"
              {...field}
            />
            <FieldDescription id="bio-disclosure-hint">
              Luôn hiện ở đầu Trang bio sau chữ &quot;Minh bạch liên kết:&quot;; không tắt được.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </CmsForm>
  );
}
