import { Skeleton } from "@/components/ui/skeleton";

export function BannerListSkeleton() {
  return (
    <div className="space-y-space-md">
      <Skeleton className="h-9 w-40" />
      <ul className="space-y-space-sm">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="flex gap-space-md rounded-xl border p-space-md">
            <Skeleton className="aspect-[2/1] w-24 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-11 w-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
