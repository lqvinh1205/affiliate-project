"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { setInspirationStatus } from "@/modules/inspirations/actions";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";

// "Bỏ qua" một chạm + Toast "Hoàn tác"; Cảm hứng *Bỏ qua* có "Đưa lại vào Mới" (UX-DR61). Cảm hứng *Đã dùng* không
// có hai nút này (trạng thái suy ra từ Bộ nội dung).
export function InspirationStatusActions({ id, skipped }: { id: string; skipped: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const set = (status: "NEW" | "SKIPPED", message: string, undo: boolean) =>
    startTransition(async () => {
      const res = await callAction(() => setInspirationStatus({ id, status }));
      if (!res.ok) return void toast.error(res.error);
      router.refresh();
      toast.success(message, undo ? { action: { label: "Hoàn tác", onClick: () => set("NEW", "Đã đưa lại vào Mới", false) } } : undefined);
    });

  return skipped ? (
    <Button type="button" variant="outline" size="lg" disabled={pending} onClick={() => set("NEW", "Đã đưa lại vào Mới", false)}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
      Đưa lại vào Mới
    </Button>
  ) : (
    <Button type="button" variant="outline" size="lg" disabled={pending} onClick={() => set("SKIPPED", "Đã bỏ qua Cảm hứng", true)}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <SkipForward aria-hidden />}
      Bỏ qua
    </Button>
  );
}
