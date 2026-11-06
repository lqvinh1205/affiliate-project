import { Skeleton } from "@/components/ui/skeleton";

// Cùng bố cục `/bio` (UX-DR34): giới thiệu, hộp nhãn, hàng chip, ProductCard *row* (ảnh vuông 80px).
export function BioSkeleton() {
  return (
    <div className="mx-auto max-w-[560px] space-y-space-lg px-margin py-space-lg">
      <div className="space-y-space-sm">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-28" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex gap-space-sm">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="space-y-space-sm">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-space-md rounded-xl p-space-md">
            <Skeleton className="size-20 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-space-sm">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
