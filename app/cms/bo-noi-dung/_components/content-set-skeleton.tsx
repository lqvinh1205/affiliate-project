import { Skeleton } from "@/components/ui/skeleton";

export function ContentSetSkeleton() {
  return (
    <div className="space-y-space-lg">
      <Skeleton className="h-9 w-48" />
      <div className="space-y-space-sm rounded-xl border p-space-md">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-11 w-full" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-space-sm rounded-xl border p-space-md">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
}
