"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GENERATING_TIMEOUT_MS, POLL_INTERVAL_MS } from "@/modules/suggestions/constants";

// Đúng một poller mỗi màn (spine AD-18): khi màn còn gợi ý `GENERATING`, gọi `router.refresh()` mỗi 3 giây để Server
// Component đọc lại `cms-queries` của `suggestions`; dừng sau 120 giây tính từ gợi ý cũ nhất đang tạo (`startedAt`),
// lần làm mới cuối để màn hiện nó là Lỗi. Không có action đọc. Screen chỉ render poller khi còn gợi ý đang tạo.
export function GeneratingPoller({ startedAt }: { startedAt: string }) {
  const router = useRouter();
  useEffect(() => {
    const stopAt = Date.parse(startedAt) + GENERATING_TIMEOUT_MS + POLL_INTERVAL_MS;
    const timer = window.setInterval(() => {
      router.refresh();
      if (Date.now() > stopAt) window.clearInterval(timer);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [router, startedAt]);
  return null;
}
