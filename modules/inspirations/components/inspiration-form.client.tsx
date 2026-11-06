"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileVideo, ImageIcon, X } from "lucide-react";
import { uploadedMediaKind } from "@/platform/upload-rules";
import { saveInspiration } from "@/modules/inspirations/actions";
import { INSPIRATION_NOTE_MAX } from "@/modules/inspirations/constants";
import { inspirationInputSchema, type InspirationFormValues } from "@/modules/inspirations/schema";
import { CmsForm } from "@/components/shared/cms-form.client";
import { UploadField } from "@/components/shared/upload-field.client";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EMPTY: InspirationFormValues = { url: "", mediaUrl: "", note: "" };

// Form Cảm hứng (FR-1, UX-DR76): dán link (nhận cả đoạn chữ chia sẻ có link), file video/ảnh tải lên (video ≤ 100 MB,
// AD-24), một dòng ghi chú. Chỉ cần link **hoặc** file. Tạo nhanh: ô link tự focus, Lưu xong form trống lại để lưu
// tiếp (dưới 3 lần chạm sau khi dán). Có `id` là sửa (vd tải thêm file video để AI có thêm dữ liệu — UX-DR77).
export function InspirationForm({
  defaultValues = EMPTY,
  autoFocus = false,
  onSaved,
}: {
  defaultValues?: InspirationFormValues;
  autoFocus?: boolean;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(inspirationInputSchema), defaultValues });
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const creating = !defaultValues.id;

  return (
    <CmsForm
      form={form}
      action={saveInspiration}
      submitLabel={creating ? "Lưu cảm hứng" : "Lưu"}
      successMessage={creating ? "Đã lưu cảm hứng" : "Đã lưu"}
      busyLabel={uploading ? "Đang tải file…" : null}
      onSaved={(saved) => {
        if (creating) form.reset(EMPTY);
        else router.refresh();
        onSaved?.(saved.id);
      }}
    >
      <Controller
        name="url"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="inspiration-url">Link video hoặc trang (TikTok, Pinterest, Shopee…)</FieldLabel>
            <Input
              id="inspiration-url"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus={autoFocus}
              placeholder="Dán link vào đây"
              aria-invalid={fieldState.invalid}
              {...field}
              value={field.value ?? ""}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name="note"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="inspiration-note">Ghi chú (không bắt buộc)</FieldLabel>
            <Input
              id="inspiration-note"
              autoComplete="off"
              maxLength={INSPIRATION_NOTE_MAX}
              placeholder="Vd: mẹo gấp áo, tìm bảng gấp"
              aria-invalid={fieldState.invalid}
              {...field}
              value={field.value ?? ""}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name="mediaUrl"
        control={form.control}
        render={({ field, fieldState }) => {
          const kind = field.value ? uploadedMediaKind(field.value) : null;
          const error = fileError ?? fieldState.error?.message ?? null;
          return (
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="inspiration-file">File video hoặc ảnh (không bắt buộc)</FieldLabel>
              {field.value ? (
                <div className="flex min-h-touch-target items-center justify-between gap-space-sm rounded-lg border px-space-sm">
                  <span className="flex items-center gap-space-sm text-body-sm">
                    {kind === "video" ? <FileVideo className="size-4" aria-hidden /> : <ImageIcon className="size-4" aria-hidden />}
                    {kind === "video" ? "Đã tải video" : "Đã tải ảnh"}
                  </span>
                  <Button type="button" variant="ghost" size="lg" onClick={() => field.onChange("")}>
                    <X aria-hidden /> Bỏ file
                  </Button>
                </div>
              ) : (
                <UploadField
                  id="inspiration-file"
                  mode="append"
                  kind="media"
                  invalid={!!error}
                  describedBy="inspiration-file-hint"
                  onError={setFileError}
                  onUploadingChange={setUploading}
                  onUploaded={(url) => field.onChange(url)}
                />
              )}
              <FieldDescription id="inspiration-file-hint">Video tối đa 100 MB.</FieldDescription>
              {error && <FieldError errors={[{ message: error }]} />}
            </Field>
          );
        }}
      />
    </CmsForm>
  );
}
