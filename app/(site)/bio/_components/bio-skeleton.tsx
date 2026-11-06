import { Skeleton } from "@/components/ui/skeleton";

// Cùng bố cục `/bio` (UX-DR34): đầu trang căn giữa, hộp nhãn, dòng Danh mục, ProductCard *row* (ảnh vuông 80px).
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
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
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
