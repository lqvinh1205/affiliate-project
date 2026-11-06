"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function elapsed(startedAt: string, now: number) {
  const s = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// GeneratingIndicator (UX-DR42): thay thân thẻ khi `GENERATING` — dòng trạng thái, thanh tiến trình không xác định,
// thời gian đã chạy, 3 dòng Skeleton. Việc hỏi lại trạng thái do `GeneratingPoller` (một mỗi màn) lo.
export function GeneratingIndicator({ label, startedAt }: { label: string; startedAt: string }) {
  // Thời gian chỉ tính phía client (AD-27); lần render đầu chưa có giờ client thì hiện "0:00".
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div role="status" aria-live="polite" className="space-y-space-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <p className="text-body-sm">{label}</p>
        <span className="text-label-meta text-on-surface-variant" aria-label="Thời gian đã chạy">
          {now === null ? "0:00" : elapsed(startedAt, now)}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full w-1/3 animate-[progress-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:w-full motion-reduce:animate-none" />
      </div>
      <div className="space-y-2" aria-hidden>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
