"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveSuggestion } from "@/modules/suggestions/actions";
import { RejectSuggestionButton } from "@/modules/suggestions/components/reject-suggestion-button.client";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";

// Chân thẻ Danh mục gợi ý *Chờ duyệt*: "Duyệt" (ghi Danh mục của Sản phẩm) + "Từ chối"; không có "Tạo lại" (AD-19).
export function CategorySuggestionActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const approve = () =>
    startTransition(async () => {
      const res = await callAction(() => approveSuggestion({ id }));
      if (!res.ok) return void toast.error(res.error);
      toast.success("Đã duyệt");
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-space-sm lg:flex-row-reverse lg:justify-start">
      <Button type="button" size="lg" className="w-full lg:w-auto" disabled={pending} onClick={approve}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {pending ? "Đang duyệt…" : "Duyệt"}
      </Button>
      <RejectSuggestionButton id={id} />
    </div>
  );
}
