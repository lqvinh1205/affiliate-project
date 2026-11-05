import { cn } from "@/components/ui/lib/utils";

export function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return (
    <span
      className={cn(
        "rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        status === "PUBLISHED" ? "bg-meo-vat-soft text-meo-vat" : "bg-secondary text-secondary-foreground",
      )}
    >
      {status === "PUBLISHED" ? "Đã đăng" : "Nháp"}
    </span>
  );
}
