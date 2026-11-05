import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";

// 404 chung của CMS (AD-12): Screen gọi `notFound()` khi không có bản ghi.
export default function CmsNotFound() {
  return (
    <div className="space-y-space-md py-space-xl text-center">
      <h1 className="text-headline-sm">Không tìm thấy. Có thể đã bị xoá.</h1>
      <Link href="/cms" className={cn(buttonVariants({ variant: "outline" }), "min-h-touch-target lg:min-h-0")}>
        Về trang CMS
      </Link>
    </div>
  );
}
