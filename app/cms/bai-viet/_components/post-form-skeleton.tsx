import { Skeleton } from "@/components/ui/skeleton";

export function PostFormSkeleton() {
  return (
    <div className="space-y-space-lg">
      <div className="space-y-space-xs">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-11 w-full" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
