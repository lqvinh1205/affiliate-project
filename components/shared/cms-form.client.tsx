"use client";

import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { callAction } from "@/components/shared/call-action";
import { UnsavedChangesGuard } from "@/components/shared/unsaved-changes-guard.client";
import { Button } from "@/components/ui/button";

// Khung form CMS (UX-DR60): validate tại trường bằng resolver của `form`, gửi giá trị form (chưa
// transform) cho action — server parse lại bằng cùng schema. Lỗi server/mạng → Toast, dữ liệu giữ nguyên.
// Nút Lưu dính đáy trên mobile, tắt + spinner khi gửi; có UnsavedChangesGuard. `busyLabel` (vd "Đang tải ảnh…")
// chặn Lưu khi form còn việc dở (đang upload file).
export function CmsForm<TValues extends FieldValues, TOutput, TResult extends object>({
  form,
  action,
  onSaved,
  successMessage = "Đã lưu",
  submitLabel = "Lưu",
  pendingLabel = "Đang lưu…",
  busyLabel = null,
  children,
}: {
  form: UseFormReturn<TValues, unknown, TOutput>;
  action: (values: TValues) => Promise<Result<TResult>>;
  onSaved?: (result: TResult, values: TValues) => void;
  successMessage?: string;
  submitLabel?: string;
  pendingLabel?: string;
  busyLabel?: string | null;
  children: ReactNode;
}) {
  const { isDirty, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async () => {
    if (busyLabel) return;
    const values = form.getValues();
    const res = await callAction(() => action(values));
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    // Đã lưu: giá trị hiện tại thành mốc "sạch" cho UnsavedChangesGuard.
    form.reset(values);
    toast.success(successMessage);
    onSaved?.(res, values);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-space-lg">
      <UnsavedChangesGuard when={isDirty && !isSubmitting} />
      {children}
      <div className="sticky-bar sticky bottom-0 z-20 -mx-margin border-t px-margin pt-space-sm pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-sticky-bottom lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
        <Button type="submit" size="lg" className="w-full lg:w-auto" disabled={isSubmitting || !!busyLabel}>
          {(isSubmitting || busyLabel) && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? pendingLabel : (busyLabel ?? submitLabel)}
        </Button>
      </div>
    </form>
  );
}
