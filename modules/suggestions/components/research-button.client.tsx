"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { researchProduct } from "@/modules/suggestions/actions";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";

// Nút "Nghiên cứu" khi Sản phẩm chưa có hồ sơ (UX-DR45): action ghi gợi ý `GENERATING` rồi trả ngay; màn làm mới
// để hiện GeneratingIndicator và poller.
export function ResearchButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const start = () =>
    startTransition(async () => {
      const res = await callAction(() => researchProduct({ productId }));
      if (!res.ok) return void toast.error(res.error);
      router.refresh();
    });
  return (
    <Button type="button" size="lg" className="w-full lg:w-auto" disabled={pending} onClick={start}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
      {pending ? "Đang gửi…" : "Nghiên cứu"}
    </Button>
  );
}
