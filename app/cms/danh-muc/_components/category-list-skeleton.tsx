import { Skeleton } from "@/components/ui/skeleton";

export function CategoryListSkeleton() {
  return (
    <div className="space-y-space-md">
      <Skeleton className="h-9 w-40" />
      <ul className="space-y-space-sm">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="space-y-2 rounded-xl border p-space-md">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-11 w-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
