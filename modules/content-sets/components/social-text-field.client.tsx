"use client";

import { useEffect, useRef } from "react";
import { CopyButton } from "@/components/shared/copy-button.client";
import { selectSentence } from "@/components/shared/select-sentence";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/lib/utils";
import type { CopyOptions, Highlight } from "@/modules/content-sets/components/threads-parts-field.client";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// Một ô chữ của bài mạng xã hội (UX-DR41): Bài Facebook (đếm từ) hoặc Bình luận kèm link (`maxChars`: bộ đếm ký tự
// theo giới hạn nền tảng, đỏ khi vượt); kèm CopyButton. `highlight`: bôi câu của RiskWarning.
export function SocialTextField({
  id,
  label,
  value,
  onChange,
  countWords = false,
  maxChars,
  copy,
  highlight,
  onHighlightMissing,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  countWords?: boolean;
  maxChars?: number;
  copy: CopyOptions;
  highlight?: Highlight;
  onHighlightMissing?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!highlight || !ref.current) return;
    if (!selectSentence(ref.current, highlight.sentence)) onHighlightMissing?.();
    // Chỉ chạy lại khi có lần chạm mới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight?.key]);
  // Đếm như server kiểm (bỏ khoảng trắng đầu/cuối).
  const chars = value.trim().length;
  const over = maxChars !== undefined && chars > maxChars;

  return (
    <div className="space-y-space-sm">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Textarea
        id={id}
        ref={ref}
        value={value}
        aria-invalid={over || undefined}
        aria-describedby={`${id}-count`}
        className="min-h-32 text-body-regular"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center justify-between gap-space-sm">
        <span
          id={`${id}-count`}
          aria-live="polite"
          className={cn("text-label-meta", over ? "text-error" : "text-on-surface-variant")}
        >
          {countWords ? `${words(value)} từ` : maxChars !== undefined ? `${chars}/${maxChars}` : ""}
          {over && <span className="sr-only"> — vượt giới hạn</span>}
        </span>
        <CopyButton text={value} label={`Sao chép ${label.toLowerCase()}`} {...copy} />
      </div>
    </div>
  );
}
