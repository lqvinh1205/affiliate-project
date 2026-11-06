"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rejectSuggestion } from "@/modules/suggestions/actions";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";

// Nút "Từ chối" của SuggestionCard (UX-DR41): gợi ý bị bỏ, thẻ thu còn đầu thẻ (+ "Tạo lại" nếu loại thẻ có).
export function RejectSuggestionButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const reject = () =>
    startTransition(async () => {
      const res = await callAction(() => rejectSuggestion({ id }));
      if (!res.ok) return void toast.error(res.error);
      toast.success("Đã từ chối");
      router.refresh();
    });
  return (
    <Button type="button" variant="outline" size="lg" className="w-full lg:w-auto" disabled={pending} onClick={reject}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {pending ? "Đang từ chối…" : "Từ chối"}
    </Button>
  );
}
