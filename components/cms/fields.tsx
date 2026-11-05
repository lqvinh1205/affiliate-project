"use client";

import { Label } from "@/components/ui/label";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
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

export function CategoryPicker({ value, onChange }: { value: CategoryKey; onChange: (v: CategoryKey) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md border bg-background px-3 py-3 text-left transition",
            value === key ? "border-primary ring-2 ring-primary/30" : "hover:border-foreground/30",
          )}
        >
          <span className="block font-semibold">{CATEGORIES[key].label}</span>
          <span className="block text-xs text-muted-foreground">{CATEGORIES[key].description}</span>
        </button>
      ))}
    </div>
  );
}
