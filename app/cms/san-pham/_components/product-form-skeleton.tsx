import { Skeleton } from "@/components/ui/skeleton";

export function ProductFormSkeleton() {
  return (
    <div className="space-y-space-lg">
      <div className="space-y-space-xs">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-48" />
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full lg:w-24" />
    </div>
  );
}
