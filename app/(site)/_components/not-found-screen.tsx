import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

// 404 của site (UX-DR68, UX-DR33), dùng chung cho `app/(site)/not-found.tsx` và `app/not-found.tsx` (AD-12).
// SearchBox và 3 bài Xem nhiều thêm ở Epic 8.
export function NotFoundScreen() {
  return (
    <EmptyState
      titleAs="h1"
      title="Trang này không còn ở đây"
      description="Có thể bài đã được gỡ hoặc đường dẫn bị gõ nhầm. Quay về Trang chủ đọc mẹo mới nhé."
    >
      <Link href="/" className={buttonVariants({ size: "lg", className: "min-h-touch-target" })}>
        Về Trang chủ
      </Link>
    </EmptyState>
  );
}
