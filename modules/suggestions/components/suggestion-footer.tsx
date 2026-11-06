import type { ReactNode } from "react";

// Chân SuggestionCard (UX-DR41): mobile "Duyệt" rộng hết thẻ, hàng dưới "Từ chối" + "Tạo lại" chia đôi; desktop ba nút
// cùng hàng căn phải. Không dính, không "Duyệt tất cả". `reason`: dòng lý do khi "Duyệt" tắt (nút trỏ tới bằng
// `aria-describedby` = `reasonId`).
export function SuggestionFooter({
  approve,
  reject,
  regenerate,
  reason,
  reasonId,
}: {
  approve?: ReactNode;
  reject?: ReactNode;
  regenerate?: ReactNode;
  reason?: string | null;
  reasonId?: string;
}) {
  return (
    <div className="space-y-space-sm">
      <div className="flex flex-col gap-space-sm lg:flex-row-reverse lg:items-center lg:justify-start">
        {approve}
        {(reject || regenerate) && (
          <div className="grid grid-cols-2 gap-space-sm lg:flex">
            {reject}
            {regenerate}
          </div>
        )}
      </div>
      {reason && (
        <p id={reasonId} className="text-body-sm text-on-surface-variant lg:text-right">
          {reason}
        </p>
      )}
    </div>
  );
}
