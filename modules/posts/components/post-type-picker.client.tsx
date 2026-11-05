"use client";

import type { PostType } from "@/generated/prisma/enums";
import { POST_TYPE_KEYS, POST_TYPES } from "@/modules/posts/constants";
import { cn } from "@/components/ui/lib/utils";

// Chọn Loại bài (enum `PostType`): nhóm nút radio hai lựa chọn kèm mô tả, vùng bấm ≥ 44px.
export function PostTypePicker({
  value,
  onChange,
  labelledBy,
}: {
  value: PostType;
  onChange: (v: PostType) => void;
  labelledBy: string;
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-2 gap-space-sm">
      {POST_TYPE_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "min-h-touch-target rounded-xl border px-space-sm py-space-sm text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary",
            value === key ? "border-primary bg-surface-container-low ring-2 ring-primary/30" : "hover:border-outline",
          )}
        >
          <span className="block text-label-md">{POST_TYPES[key].label}</span>
          <span className="block text-body-sm text-on-surface-variant">{POST_TYPES[key].description}</span>
        </button>
      ))}
    </div>
  );
}
