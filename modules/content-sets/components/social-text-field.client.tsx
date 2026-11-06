"use client";

import { useEffect, useRef } from "react";
import { CopyButton } from "@/components/shared/copy-button.client";
import { selectSentence } from "@/components/shared/select-sentence";
import { Textarea } from "@/components/ui/textarea";
import type { CopyOptions, Highlight } from "@/modules/content-sets/components/threads-parts-field.client";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// Một ô chữ của bài mạng xã hội (UX-DR41): Bài Facebook (đếm từ) hoặc Bình luận kèm link; kèm CopyButton.
// `highlight`: bôi câu của RiskWarning.
export function SocialTextField({
  id,
  label,
  value,
  onChange,
  countWords = false,
  copy,
  highlight,
  onHighlightMissing,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  countWords?: boolean;
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

  return (
    <div className="space-y-space-sm">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Textarea
        id={id}
        ref={ref}
        value={value}
        className="min-h-32 text-body-regular"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center justify-between gap-space-sm">
        <span className="text-label-meta text-on-surface-variant">{countWords ? `${words(value)} từ` : ""}</span>
        <CopyButton text={value} label={`Sao chép ${label.toLowerCase()}`} {...copy} />
      </div>
    </div>
  );
}
