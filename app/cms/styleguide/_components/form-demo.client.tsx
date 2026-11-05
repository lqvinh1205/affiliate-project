"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { requiredText } from "@/platform/validation/fields";
import { CmsForm } from "@/components/shared/cms-form.client";
import { ConfirmDialog } from "@/components/shared/confirm-dialog.client";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const demoSchema = z.object({ name: requiredText(20, "Nhập tên") });

// Action giả: chờ 1,5 giây để thấy trạng thái đang gửi; không ghi gì.
async function fakeSave(): Promise<Result> {
  await new Promise((r) => setTimeout(r, 1500));
  return { ok: true };
}

// Mẫu CmsForm (bấm Lưu khi trống → lỗi tại trường; có tên → nút tắt + spinner) và Field có lỗi sẵn.
export function FormDemo() {
  const form = useForm({ resolver: zodResolver(demoSchema), defaultValues: { name: "" } });
  return (
    <div className="space-y-space-lg">
      <Field data-invalid>
        <FieldLabel htmlFor="sg-field-error">Field có lỗi</FieldLabel>
        <Input id="sg-field-error" defaultValue="Đồ Bếp" aria-invalid />
        <FieldDescription>Chữ thường không dấu, số và dấu gạch ngang.</FieldDescription>
        <FieldError>Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang (vd: do-bep)</FieldError>
      </Field>
      <CmsForm form={form} action={fakeSave}>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sg-cms-form-name">CmsForm — tên ({field.value.length}/20)</FieldLabel>
              <Input id="sg-cms-form-name" aria-invalid={fieldState.invalid} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </CmsForm>
    </div>
  );
}

export function ConfirmDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        Mở ConfirmDialog
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={'Xoá Danh mục "Nhà bếp"?'}
        description="Danh mục sẽ bị xoá vĩnh viễn và biến mất khỏi website."
        onConfirm={() => {
          setOpen(false);
          toast.success("Mẫu: không xoá gì");
        }}
      />
    </>
  );
}
