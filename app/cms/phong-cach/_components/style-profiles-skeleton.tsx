import { Skeleton } from "@/components/ui/skeleton";

export function StyleProfilesSkeleton() {
  return (
    <div className="space-y-space-lg">
      <Skeleton className="h-9 w-56" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-space-sm rounded-xl border p-space-md">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </div>
  );
}
