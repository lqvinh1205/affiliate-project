import { Skeleton } from "@/components/ui/skeleton";

// Cùng bố cục `/bio` (UX-DR34): đầu trang căn giữa, hộp nhãn, dòng Danh mục (ô chữ cái 40px), ProductCard *bio*
// (ảnh vuông 96px).
export function BioSkeleton() {
  return (
    <div className="mx-auto max-w-[560px] space-y-space-lg px-margin py-space-lg">
      <div className="flex flex-col items-center gap-space-sm">
        <Skeleton className="size-20 rounded-2xl" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="space-y-space-sm">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-space-sm rounded-xl border border-outline-variant/60 p-space-md">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-space-sm">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-space-sm rounded-xl px-space-sm py-space-md">
            <Skeleton className="size-24 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-space-xs">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center justify-between gap-space-sm">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
