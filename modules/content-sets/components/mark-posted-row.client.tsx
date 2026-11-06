"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { formatShortDate } from "@/platform/format";
import { markPosted, unmarkPosted } from "@/modules/content-sets/actions";
import { PLATFORM_LABEL, SOCIAL_POST_URL_MAX, type SocialPlatform } from "@/modules/content-sets/constants";
import { markPostedInputSchema } from "@/modules/content-sets/schema";
import { callAction } from "@/components/shared/call-action";
import { Badge } from "@/components/ui/badge";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Hàng "Đánh dấu đã đăng" / badge "Đã đăng · dd/mm/yyyy" + link (UX-DR56, FR-20) dưới bài và Bình luận cùng nền
// tảng. MarkPostedDialog có ô link bài đăng tuỳ chọn, kiểm URL bằng cùng schema với server (AD-14). Bỏ đánh dấu được.
export function MarkPostedRow({
  id,
  platform,
  postedAt,
  postUrl,
}: {
  id: string;
  platform: SocialPlatform;
  postedAt: string | null;
  postUrl: string | null;
}) {
  const router = useRouter();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const parsed = markPostedInputSchema.safeParse({ id, postUrl: url });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError(null);
    startTransition(async () => {
      const res = await callAction(() => markPosted({ id, postUrl: url }));
      if (!res.ok) return void toast.error(res.error);
      setOpen(false);
      setUrl("");
      toast.success("Đã đánh dấu đã đăng");
      router.refresh();
    });
  };

  const unmark = () =>
    startTransition(async () => {
      const res = await callAction(() => unmarkPosted({ id }));
      if (!res.ok) return void toast.error(res.error);
      toast.success("Đã bỏ đánh dấu");
      router.refresh();
    });

  if (postedAt) {
    return (
      <div className="flex flex-wrap items-center gap-space-sm rounded-xl border px-space-md py-space-sm">
        <Badge className="bg-secondary-container text-on-secondary-container">
          Đã đăng · {formatShortDate(new Date(postedAt))}
        </Badge>
        {postUrl && (
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-touch-target items-center gap-1 text-label-md text-primary hover:underline"
          >
            <ExternalLink className="size-4" aria-hidden /> Mở bài đã đăng<span className="sr-only"> (mở tab mới)</span>
          </a>
        )}
        <Button type="button" variant="ghost" size="lg" className="ml-auto" disabled={pending} onClick={unmark}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Bỏ đánh dấu
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" size="lg" className="w-full lg:w-auto" onClick={() => setOpen(true)}>
        <Send aria-hidden /> Đánh dấu đã đăng
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Đánh dấu Bài {PLATFORM_LABEL[platform]} đã đăng</DialogTitle>
            <DialogDescription>Dán link bài đã đăng để mở lại sau (không bắt buộc).</DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor={inputId}>Link bài đăng (tuỳ chọn)</FieldLabel>
            <Input
              id={inputId}
              type="url"
              inputMode="url"
              autoComplete="off"
              maxLength={SOCIAL_POST_URL_MAX}
              placeholder="https://www.threads.net/@…"
              aria-invalid={!!error}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {error && <FieldError errors={[{ message: error }]} />}
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="lg" disabled={pending} />}>Huỷ</DialogClose>
            <Button type="button" size="lg" disabled={pending} onClick={save}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {pending ? "Đang lưu…" : "Đã đăng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
