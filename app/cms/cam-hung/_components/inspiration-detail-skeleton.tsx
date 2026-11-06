import { Skeleton } from "@/components/ui/skeleton";

export function InspirationDetailSkeleton() {
  return (
    <div className="space-y-space-md">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-11 w-full lg:w-48" />
    </div>
  );
}
