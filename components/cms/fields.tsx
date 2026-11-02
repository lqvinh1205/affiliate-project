"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import type { ProductInput } from "@/lib/post-input";
import { cn } from "@/lib/utils";

export const emptyProduct = (): ProductInput => ({ name: "", image: "", price: "", affiliateUrl: "" });

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

export function ProductFields({
  products,
  onChange,
}: {
  products: ProductInput[];
  onChange: (p: ProductInput[]) => void;
}) {
  const update = (i: number, patch: Partial<ProductInput>) =>
    onChange(products.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-3">
      {products.map((p, i) => (
        <div key={i} className="space-y-3 rounded-md border bg-background p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sản phẩm {i + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Xóa sản phẩm"
              onClick={() => onChange(products.filter((_, j) => j !== i))}
            >
              <Trash2 />
            </Button>
          </div>
          <Input
            placeholder="Tên sản phẩm *"
            value={p.name}
            onChange={(e) => update(i, { name: e.target.value })}
            className="h-10"
          />
          <Input
            placeholder="Link affiliate Shopee * (https://s.shopee.vn/...)"
            inputMode="url"
            value={p.affiliateUrl}
            onChange={(e) => update(i, { affiliateUrl: e.target.value })}
            className="h-10"
          />
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <Input
              placeholder="Link ảnh (down-vn.img.susercontent.com)"
              inputMode="url"
              value={p.image ?? ""}
              onChange={(e) => update(i, { image: e.target.value })}
              className="h-10"
            />
            <Input
              placeholder="Giá"
              value={p.price ?? ""}
              onChange={(e) => update(i, { price: e.target.value })}
              className="h-10"
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-10 w-full" onClick={() => onChange([...products, emptyProduct()])}>
        <Plus /> Thêm sản phẩm
      </Button>
    </div>
  );
}
