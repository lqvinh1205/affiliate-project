import { Skeleton } from "@/components/ui/skeleton";

export function InspirationListSkeleton() {
  return (
    <div className="space-y-space-md">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-11 w-full lg:w-48" />
      <div className="flex gap-space-sm">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <ul className="space-y-space-sm">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="space-y-2 rounded-xl border p-space-md">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
