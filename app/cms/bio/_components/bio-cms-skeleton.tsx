import { Skeleton } from "@/components/ui/skeleton";

export function BioCmsSkeleton() {
  return (
    <div className="space-y-space-lg">
      <Skeleton className="h-9 w-40" />
      <div className="space-y-space-sm rounded-xl border p-space-md">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full lg:w-24" />
      </div>
      <div className="space-y-space-sm rounded-xl border p-space-md">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-space-md">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-9 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
