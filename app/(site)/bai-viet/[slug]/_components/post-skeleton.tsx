import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:py-12">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="aspect-video w-full rounded-sm" />
    </div>
  );
}
