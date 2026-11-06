"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Platform } from "@/generated/prisma/enums";
import { PLATFORM_PART_LABEL } from "@/modules/content-sets/constants";
import { addContentSetPlatform } from "@/modules/suggestions/actions";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";

// Dòng "Thêm Bài {nền tảng}" cho nền tảng chưa có trong bộ (UX-DR75): tạo gợi ý mới vào cùng bộ, thẻ ở Đang tạo.
export function AddPlatformButton({ contentSetId, platform }: { contentSetId: string; platform: Platform }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const add = () =>
    startTransition(async () => {
      const res = await callAction(() => addContentSetPlatform({ contentSetId, platform }));
      if (!res.ok) return void toast.error(res.error);
      router.refresh();
    });
  return (
    <Button type="button" variant="outline" size="lg" className="w-full justify-start" disabled={pending} onClick={add}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
      {pending ? "Đang gửi…" : `Thêm ${PLATFORM_PART_LABEL[platform]}`}
    </Button>
  );
}
