"use client";

import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { POST_EXCERPT_MAX, POST_SEO_DESCRIPTION_TARGET, POST_SEO_TITLE_TARGET, POST_TITLE_TARGET, POST_TYPES } from "@/modules/posts/constants";
import type { RiskWarning, WebPostPayload } from "@/modules/posts/types";
import { PostBodyEditor } from "@/modules/posts/components/post-body-editor.client";
import { RiskWarningList } from "@/modules/posts/components/risk-warning-list.client";
import { webPostPayloadSchema } from "@/modules/posts/prompts/web-post.prompt";
import { callAction } from "@/components/shared/call-action";
import { UnsavedChangesGuard } from "@/components/shared/unsaved-changes-guard.client";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/lib/utils";

function count(value: string, max: number) {
  return <span className={value.length > max ? "text-error" : "text-on-surface-variant"}> ({value.length}/{max})</span>;
}

// Form gợi ý Bài web *Chờ duyệt* (UX-DR41): tiêu đề, tóm tắt, PostEditor thu gọn 8 dòng ("Mở toàn bộ"), SEO trong mục
// mở rộng; thẻ, Danh mục, Loại bài gợi ý hiện để biết (tự điền vào bài khi Duyệt — FR-11, sửa ở Soạn Bài web).
// RiskWarning trên thân; chạm mục bôi câu trong PostEditor (UX-DR43). Validate tại trường bằng `webPostPayloadSchema`
// (AD-14). Nơi dùng truyền `action` (Duyệt của `suggestions`) và dựng chân thẻ quanh nút gửi (`footer`).
export function WebPostSuggestionForm({
  defaultValues,
  riskWarnings,
  action,
  blockedReason,
  reasonId,
  footer,
  onSaved,
}: {
  defaultValues: WebPostPayload;
  riskWarnings: RiskWarning[];
  action: (values: WebPostPayload) => Promise<Result<object>>;
  blockedReason: string | null;
  reasonId: string;
  footer: (submit: ReactNode) => ReactNode;
  onSaved?: () => void;
}) {
  const payload = defaultValues;
  const id = reasonId;
  const form = useForm({ resolver: zodResolver(webPostPayloadSchema), defaultValues });
  const { control, formState } = form;
  const [expanded, setExpanded] = useState(false);
  const [highlight, setHighlight] = useState<{ sentence: string; key: number } | null>(null);

  const onSubmit = form.handleSubmit(async () => {
    if (blockedReason) return void toast.error(blockedReason);
    const values = form.getValues();
    const res = await callAction(() => action(values));
    if (!res.ok) return void toast.error(res.error);
    form.reset(values);
    toast.success("Đã duyệt");
    onSaved?.();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-space-md">
      <UnsavedChangesGuard when={formState.isDirty && !formState.isSubmitting} />
      <RiskWarningList
        warnings={riskWarnings}
        onSelect={(w) => {
          setExpanded(true);
          setHighlight({ sentence: w.sentence, key: Date.now() });
        }}
      />
      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${id}-title`}>Tiêu đề{count(field.value, POST_TITLE_TARGET)}</FieldLabel>
            <Input id={`${id}-title`} autoComplete="off" aria-invalid={fieldState.invalid} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="excerpt"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${id}-excerpt`}>Tóm tắt{count(field.value, POST_EXCERPT_MAX)}</FieldLabel>
            <Textarea id={`${id}-excerpt`} rows={2} aria-invalid={fieldState.invalid} {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="content"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel id={`${id}-content-label`}>Thân bài</FieldLabel>
            <div className={cn("relative", !expanded && "max-h-80 overflow-hidden")}>
              <PostBodyEditor
                id={`${id}-content`}
                labelledBy={`${id}-content-label`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
                highlight={highlight}
                onHighlightMissing={() => toast.info("Không còn thấy câu này trong thân bài — có thể bạn đã sửa.")}
              />
            </div>
            <Button type="button" variant="ghost" size="lg" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Thu gọn" : "Mở toàn bộ"}
            </Button>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <details className="rounded-xl border p-space-md">
        <summary className="min-h-touch-target cursor-pointer content-center text-label-md">SEO và gợi ý khác</summary>
        <div className="mt-space-md space-y-space-md">
          <Controller
            name="seoTitle"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-seo-title`}>Tiêu đề SEO{count(field.value, POST_SEO_TITLE_TARGET)}</FieldLabel>
                <Input id={`${id}-seo-title`} autoComplete="off" aria-invalid={fieldState.invalid} {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="seoDescription"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-seo-description`}>
                  Mô tả SEO{count(field.value, POST_SEO_DESCRIPTION_TARGET.max)}
                </FieldLabel>
                <Textarea id={`${id}-seo-description`} rows={3} aria-invalid={fieldState.invalid} {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <dl className="grid grid-cols-[auto_1fr] gap-x-space-sm gap-y-1 text-body-sm">
            <dt className="text-on-surface-variant">Loại bài</dt>
            <dd>{POST_TYPES[payload.postType].label}</dd>
            <dt className="text-on-surface-variant">Danh mục</dt>
            <dd>{payload.categoryName ?? "AI chưa chọn được — chọn ở Soạn Bài web"}</dd>
            <dt className="text-on-surface-variant">Thẻ</dt>
            <dd>{payload.tags.join(", ") || "—"}</dd>
            <dt className="text-on-surface-variant">Từ khoá</dt>
            <dd>{payload.seoKeywords.join(", ") || "—"}</dd>
          </dl>
        </div>
      </details>
      {footer(
          <Button
            type="submit"
            size="lg"
            className={cn("w-full lg:w-auto", blockedReason && "opacity-50")}
            aria-disabled={blockedReason ? true : undefined}
            aria-describedby={blockedReason ? reasonId : undefined}
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            {formState.isSubmitting ? "Đang duyệt…" : "Duyệt"}
          </Button>,
      )}
    </form>
  );
}
