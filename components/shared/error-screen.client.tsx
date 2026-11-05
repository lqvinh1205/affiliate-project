"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";

// Trang lỗi bất ngờ (UX-DR69, AD-13): câu chung, "Thử lại" + link Trang chủ; không hiện chi tiết lỗi. Lỗi chỉ ghi ở
// console trình duyệt (server đã ghi log riêng).
export function ErrorScreen({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <EmptyState
      titleAs="h1"
      title="Trang đang trục trặc một chút"
      description="Mình đang xử lý. Bạn thử tải lại, hoặc quay về Trang chủ đọc bài khác nhé."
    >
      <Button size="lg" onClick={() => retry()}>
        <RotateCcw aria-hidden /> Thử lại
      </Button>
      <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
        Về Trang chủ
      </Link>
    </EmptyState>
  );
}
