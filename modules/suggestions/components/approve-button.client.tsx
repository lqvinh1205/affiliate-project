"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveSuggestion } from "@/modules/suggestions/actions";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";

// Nút "Duyệt" của thẻ trong Bộ nội dung: gửi nội dung đang sửa (`getPayload`); `blockedReason` → nút tắt bằng
// `aria-disabled` (đọc được lý do qua `aria-describedby`, UX-DR41). Lỗi server (vd bài đã xuất bản) → Toast.
export function ApproveButton({
  suggestionId,
  getPayload,
  blockedReason,
  reasonId,
  onApproved,
}: {
  suggestionId: string;
  getPayload: () => unknown;
  blockedReason: string | null;
  reasonId: string;
  onApproved?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const approve = () => {
    if (blockedReason) return void toast.error(blockedReason);
    startTransition(async () => {
      const res = await callAction(() => approveSuggestion({ id: suggestionId, payload: getPayload() }));
      if (!res.ok) return void toast.error(res.error);
      toast.success("Đã duyệt");
      onApproved?.();
      router.refresh();
    });
  };
  return (
    <Button
      type="button"
      size="lg"
      className={blockedReason ? "w-full opacity-50 lg:w-auto" : "w-full lg:w-auto"}
      aria-disabled={blockedReason ? true : undefined}
      aria-describedby={blockedReason ? reasonId : undefined}
      disabled={pending}
      onClick={approve}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
      {pending ? "Đang duyệt…" : "Duyệt"}
    </Button>
  );
}
