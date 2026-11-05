import { Skeleton } from "@/components/ui/skeleton";

export function PostListSkeleton() {
  return (
    <div className="mx-auto max-w-container-max space-y-space-xl px-margin py-space-lg lg:px-margin-desktop">
      <div className="space-y-space-sm">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-x-gutter-desktop gap-y-space-xl sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] rounded-sm" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
