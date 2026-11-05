import { Skeleton } from "@/components/ui/skeleton";

// Cùng bố cục Trang chủ (UX-DR34): Bài nổi bật (ảnh 16:9; desktop 7 + 5 cột) rồi lưới Mới cập nhật.
export function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-container-max space-y-space-xl px-margin py-space-lg lg:px-margin-desktop lg:py-space-xl">
      <div className="grid overflow-hidden rounded-xl lg:grid-cols-12 lg:items-center">
        <Skeleton className="aspect-video rounded-none lg:col-span-7" />
        <div className="space-y-space-sm p-space-md lg:col-span-5 lg:p-space-lg">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="space-y-space-md">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-gutter md:grid-cols-2 lg:grid-cols-3 lg:gap-gutter-desktop">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-space-sm">
              <Skeleton className="aspect-video rounded-xl" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
