"use client";

import { Label } from "@/components/ui/label";
import type { PostType } from "@/generated/prisma/enums";
import type { CategoryOption } from "@/modules/categories/types";
import { POST_TYPE_KEYS, POST_TYPES } from "@/modules/posts/constants";
import { cn } from "@/components/ui/lib/utils";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-semibold">{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// Chọn Danh mục (model `Category`) của bài; "" = chưa có Danh mục. Native <select> cho điện thoại.
export function CategorySelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: CategoryOption[];
}) {
  return (
    <select
      aria-label="Danh mục"
      data-slot="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border bg-background px-2 text-base md:text-sm"
    >
      <option value="">Chưa có Danh mục</option>
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export function CategoryPicker({ value, onChange }: { value: PostType; onChange: (v: PostType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {POST_TYPE_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md border bg-background px-3 py-3 text-left transition",
            value === key ? "border-primary ring-2 ring-primary/30" : "hover:border-foreground/30",
          )}
        >
          <span className="block font-semibold">{POST_TYPES[key].label}</span>
          <span className="block text-xs text-muted-foreground">{POST_TYPES[key].description}</span>
        </button>
      ))}
    </div>
  );
}
