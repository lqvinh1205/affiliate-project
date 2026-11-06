"use client";

import { useEffect, useRef } from "react";
import { THREADS_POST_MAX } from "@/modules/content-sets/constants";
import { CopyButton } from "@/components/shared/copy-button.client";
import { selectSentence } from "@/components/shared/select-sentence";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/lib/utils";

export type CopyOptions = { confirmUnapproved: boolean; onCopied: () => void };
export type Highlight = { sentence: string; key: number } | null;

// Chuỗi bài Threads (UX-DR41): mỗi bài một khối viền có số "2/6", `Textarea` tự giãn, bộ đếm "182/500" (> 500 →
// màu `error`, `aria-live`) + CopyButton. Không thêm/xoá bài trong chuỗi. `highlight`: bôi câu của RiskWarning.
export function ThreadsPartsField({
  idPrefix,
  value,
  onChange,
  copy,
  highlight,
  onHighlightMissing,
}: {
  idPrefix: string;
  value: string[];
  onChange: (next: string[]) => void;
  copy: CopyOptions;
  highlight?: Highlight;
  onHighlightMissing?: () => void;
}) {
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    if (!highlight) return;
    const found = refs.current.some((el) => el && selectSentence(el, highlight.sentence));
    if (!found) onHighlightMissing?.();
    // Chỉ chạy lại khi có lần chạm mới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight?.key]);

  return (
    <ol className="space-y-space-sm" aria-label="Các bài trong chuỗi Threads">
      {value.map((text, i) => {
        const over = text.length > THREADS_POST_MAX;
        const id = `${idPrefix}-${i}`;
        return (
          <li key={i} className="space-y-space-sm rounded-lg border border-outline-variant p-space-sm">
            <label htmlFor={id} className="block text-label-meta text-on-surface-variant">
              {i + 1}/{value.length}
            </label>
            <Textarea
              id={id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={text}
              aria-invalid={over || undefined}
              aria-describedby={`${id}-count`}
              className="text-body-regular"
              onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))}
            />
            <div className="flex items-center justify-between gap-space-sm">
              <span
                id={`${id}-count`}
                aria-live="polite"
                className={cn("text-label-meta", over ? "text-error" : "text-on-surface-variant")}
              >
                {text.length}/{THREADS_POST_MAX}
                {over && <span className="sr-only"> — vượt giới hạn</span>}
              </span>
              <CopyButton text={text} label={`Sao chép bài ${i + 1}`} {...copy} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
