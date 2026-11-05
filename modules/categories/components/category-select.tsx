import type { ComponentProps } from "react";
import type { CategoryOption } from "@/modules/categories/types";

// Native <select>: dễ dùng trên điện thoại; cùng kiểu viền/focus với Input, `data-slot="input"` để cao 44px trong CMS mobile.
const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

// Chọn Danh mục (model `Category`) trong form CMS; "" = chưa có Danh mục.
export function CategorySelect({
  options,
  emptyLabel = "Chưa có Danh mục",
  ...props
}: Omit<ComponentProps<"select">, "children" | "className"> & { options: CategoryOption[]; emptyLabel?: string }) {
  return (
    <select data-slot="input" className={SELECT_CLASS} {...props}>
      <option value="">{emptyLabel}</option>
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
