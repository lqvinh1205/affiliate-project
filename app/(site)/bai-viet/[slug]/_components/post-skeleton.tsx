import { Skeleton } from "@/components/ui/skeleton";

// Cùng bố cục `PostArticle` (UX-DR34): thân 8 cột, ảnh 16:9.
export function PostSkeleton() {
  return (
    <div className="mx-auto max-w-container-max px-margin py-space-lg lg:px-margin-desktop lg:py-space-xl">
      <div className="space-y-space-lg lg:grid lg:grid-cols-12 lg:gap-gutter-desktop">
        <div className="space-y-space-lg lg:col-span-8">
          <div className="space-y-space-sm">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="space-y-space-sm">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
