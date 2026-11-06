"use client";

import { TriangleAlert } from "lucide-react";
import type { RiskWarning } from "@/modules/posts/types";

// RiskWarning (UX-DR43, FR-23): Alert nền `tertiary-fixed`, mỗi mục là nút ≥ 44px gồm câu trích (nghiêng, một dòng,
// cắt …) + lý do. Chạm mục → nơi dùng cuộn tới và bôi câu đó trong nội dung (`onSelect`). Không chặn Duyệt.
export function RiskWarningList({
  warnings,
  onSelect,
}: {
  warnings: RiskWarning[];
  onSelect: (warning: RiskWarning) => void;
}) {
  if (warnings.length === 0) return null;
  return (
    <div role="region" aria-label="Cảnh báo rủi ro" className="rounded-xl bg-tertiary-fixed p-space-sm text-on-tertiary-fixed">
      <p className="flex items-center gap-2 px-space-sm py-1 text-label-md">
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        {warnings.length} câu cần xem lại
      </p>
      <ul>
        {warnings.map((w, i) => (
          <li key={`${i}-${w.sentence}`}>
            <button
              type="button"
              onClick={() => onSelect(w)}
              className="block min-h-touch-target w-full rounded-lg px-space-sm py-2 text-left outline-offset-2 hover:bg-on-tertiary-fixed/10 focus-visible:outline-2 focus-visible:outline-on-tertiary-fixed"
            >
              <span className="block truncate italic">“{w.sentence}”</span>
              <span className="block text-body-sm">{w.reason}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
