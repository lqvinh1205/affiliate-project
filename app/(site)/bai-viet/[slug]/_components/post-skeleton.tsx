import { Skeleton } from "@/components/ui/skeleton";

// Cùng bố cục `PostArticle` (UX-DR34): đầu bài + ảnh 16:9 rộng hết khung, thân 8 cột.
export function PostSkeleton() {
  return (
    <div className="mx-auto max-w-container-max px-margin py-space-lg lg:px-margin-desktop lg:py-space-xl">
      <div className="space-y-space-lg">
        <div className="space-y-space-sm">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full max-w-4xl" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="aspect-video w-full rounded-xl" />
      </div>
      <div className="mt-space-lg lg:grid lg:grid-cols-12 lg:gap-gutter-desktop">
        <div className="space-y-space-sm lg:col-span-8">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
