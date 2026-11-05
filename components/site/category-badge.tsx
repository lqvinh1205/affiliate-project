import { cn } from "@/components/ui/lib/utils";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

const STYLES: Record<CategoryKey, string> = {
  MEO_VAT: "text-meo-vat",
  GOM_LINK: "text-gom-link",
};

// Nhãn kiểu tạp chí: chữ in hoa nhỏ, giãn chữ, không nền.
export function CategoryBadge({
  category,
  className,
}: {
  category: CategoryKey;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.12em]",
        STYLES[category],
        className,
      )}
    >
      {CATEGORIES[category].label}
    </span>
  );
}
