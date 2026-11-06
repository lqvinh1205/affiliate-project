"use client";

import type { Platform } from "@/generated/prisma/enums";
import { PLATFORM_PART_LABEL } from "@/modules/content-sets/constants";

// PlatformToggle (UX-DR51): mỗi nền tảng một dòng checkbox; Threads, Facebook có dòng phụ "kèm Bình luận kèm link".
// `existing`: nền tảng đã có trong bộ — hiện "Đã có", không chọn được (SocialFromPostDialog, UX-DR55).
export function PlatformToggle({
  options,
  value,
  onChange,
  existing = [],
  labelledBy,
}: {
  options: readonly Platform[];
  value: Platform[];
  onChange: (next: Platform[]) => void;
  existing?: Platform[];
  labelledBy: string;
}) {
  const toggle = (p: Platform, on: boolean) => onChange(on ? options.filter((o) => o === p || value.includes(o)) : value.filter((v) => v !== p));
  return (
    <div role="group" aria-labelledby={labelledBy} className="divide-y rounded-xl border">
      {options.map((p) => {
        const had = existing.includes(p);
        const id = `platform-${p}`;
        return (
          <label
            key={p}
            htmlFor={id}
            className="flex min-h-touch-target cursor-pointer items-start gap-space-sm px-space-md py-space-sm has-disabled:cursor-not-allowed"
          >
            <input
              id={id}
              type="checkbox"
              className="mt-1 size-5 shrink-0 accent-primary"
              checked={had || value.includes(p)}
              disabled={had}
              onChange={(e) => toggle(p, e.target.checked)}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-label-md">{PLATFORM_PART_LABEL[p]}</span>
              {p !== "WEBSITE" && <span className="block text-body-sm text-on-surface-variant">kèm Bình luận kèm link</span>}
            </span>
            {had && <span className="shrink-0 text-body-sm text-on-surface-variant">Đã có</span>}
          </label>
        );
      })}
    </div>
  );
}
