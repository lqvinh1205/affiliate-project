import { Skeleton } from "@/components/ui/skeleton";

export function SearchSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-space-md px-margin py-space-lg">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="flex gap-space-sm">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
    </div>
  );
}
