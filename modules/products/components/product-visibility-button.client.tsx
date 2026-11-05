"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setProductHidden } from "@/modules/products/actions";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";

// Ẩn/hiện Sản phẩm một chạm, không ConfirmDialog; Toast có "Hoàn tác" (EXPERIENCE › ConfirmDialog, FR-5).
// `usageLink` (ở danh sách): sau khi ẩn, Toast có thêm "Xem bài đang dùng" → màn chi tiết liệt kê Bài web dùng nó.
export function ProductVisibilityButton({
  id,
  name,
  hidden,
  usageLink = false,
}: {
  id: string;
  name: string;
  hidden: boolean;
  usageLink?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Hướng đang gửi (để nhãn "Đang ẩn…"/"Đang hiện…" đúng cả khi bấm "Hoàn tác" từ Toast).
  const [target, setTarget] = useState(!hidden);

  const apply = (next: boolean) => {
    setTarget(next);
    startTransition(async () => {
      const res = await callAction(() => setProductHidden({ id, hidden: next }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
      toast.success(next ? `Đã ẩn "${name}" khỏi website` : `Đã hiện lại "${name}"`, {
        action: { label: "Hoàn tác", onClick: () => apply(!next) },
        ...(next &&
          usageLink && {
            cancel: { label: "Xem bài đang dùng", onClick: () => router.push(`/cms/san-pham/${id}#product-usage`) },
          }),
      });
    });
  };

  const Icon = pending ? Loader2 : hidden ? Eye : EyeOff;
  const label = pending ? (target ? "Đang ẩn…" : "Đang hiện…") : hidden ? "Hiện lại" : "Ẩn";
  return (
    <Button
      variant="outline"
      size="lg"
      aria-label={pending ? `${label} "${name}"` : hidden ? `Hiện lại "${name}"` : `Ẩn "${name}"`}
      disabled={pending}
      onClick={() => apply(!hidden)}
    >
      <Icon className={pending ? "animate-spin" : undefined} aria-hidden />
      {label}
    </Button>
  );
}
