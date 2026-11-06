"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Platform } from "@/generated/prisma/enums";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/modules/content-sets/constants";
import { PlatformToggle } from "@/modules/content-sets/components/platform-toggle.client";
import { createSocialFromPost } from "@/modules/suggestions/actions";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NEEDS_PRODUCT = "Gắn ít nhất một Sản phẩm để có Link affiliate cho Bình luận";

// SocialFromPostDialog (UX-DR55, FR-16): ở Soạn Bài web, chọn Threads / Facebook (mỗi nền tảng kèm Bình luận kèm link).
// Nền tảng đã có trong bộ hiện "Đã có", không chọn được. Bài chưa gắn Sản phẩm (đã lưu) → nút tắt kèm lý do.
// Xác nhận → chuyển `/cms/bo-noi-dung/[id]`, thẻ mới ở Đang tạo.
export function SocialFromPostDialog({
  postId,
  hasProducts,
  existing,
}: {
  postId: string;
  hasProducts: boolean;
  existing: Platform[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const free = SOCIAL_PLATFORMS.filter((p) => !existing.includes(p));
  const [value, setValue] = useState<Platform[]>(free);
  const [pending, startTransition] = useTransition();
  const chosen = value.filter((p): p is SocialPlatform => free.includes(p as SocialPlatform));
  const reason = !hasProducts
    ? NEEDS_PRODUCT
    : free.length === 0
      ? "Bộ nội dung đã có cả Threads và Facebook — dùng Tạo lại ở Bộ nội dung."
      : chosen.length === 0
        ? "Chọn ít nhất một nền tảng"
        : null;

  const confirm = () => {
    if (reason) return;
    startTransition(async () => {
      const res = await callAction(() => createSocialFromPost({ postId, platforms: chosen }));
      if (!res.ok) return void toast.error(res.error);
      setOpen(false);
      router.push(`/cms/bo-noi-dung/${res.contentSetId}`);
    });
  };

  return (
    <>
      <Button type="button" variant="outline" size="lg" onClick={() => setOpen(true)}>
        <Share2 aria-hidden /> Tạo bài mạng xã hội
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle id="social-from-post-title">Tạo bài mạng xã hội</DialogTitle>
            <DialogDescription>
              AI viết bài theo Hồ sơ phong cách từng nền tảng, dùng nội dung Bài web làm nguồn, kèm Bình luận kèm link.
            </DialogDescription>
          </DialogHeader>
          <PlatformToggle
            options={SOCIAL_PLATFORMS}
            value={value}
            onChange={setValue}
            existing={existing}
            labelledBy="social-from-post-title"
          />
          {reason && (
            <p id="social-from-post-reason" className="text-body-sm text-on-surface-variant">
              {reason}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="lg" disabled={pending} />}>Huỷ</DialogClose>
            <Button
              type="button"
              size="lg"
              className={reason ? "opacity-50" : undefined}
              aria-disabled={reason ? true : undefined}
              aria-describedby={reason ? "social-from-post-reason" : undefined}
              disabled={pending}
              onClick={confirm}
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {pending ? "Đang gửi…" : "Tạo bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
