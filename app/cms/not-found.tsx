import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";

// 404 chung của CMS (AD-12, UX-DR84): Screen gọi `notFound()` khi không có bản ghi; đường dẫn lạ trong `/cms`.
export default function CmsNotFound() {
  return (
    <div className="space-y-space-md py-space-xl text-center">
      <h1 className="text-headline-sm">Không tìm thấy. Có thể đã bị xoá.</h1>
      <Link href="/cms/bai-viet" className={cn(buttonVariants({ variant: "outline" }), "min-h-touch-target lg:min-h-0")}>
        Về danh sách Bài web
      </Link>
    </div>
  );
}
