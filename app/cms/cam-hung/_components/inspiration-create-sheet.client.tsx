"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { InspirationForm } from "@/modules/inspirations/components/inspiration-form.client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// "Lưu cảm hứng" tạo nhanh (UX-DR76, UJ-2 bước 1): chạm nút → Sheet đáy mở, ô link tự focus → dán → "Lưu cảm hứng"
// (dưới 3 lần chạm sau khi dán). Lưu xong Sheet đóng, về danh sách *Mới* (trang 1) đã làm mới.
export function InspirationCreateSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button type="button" size="lg" className="min-h-touch-target w-full lg:min-h-0 lg:w-auto" />}>
        <Plus aria-hidden /> Lưu cảm hứng
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90dvh] gap-0 overflow-y-auto rounded-t-xl bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] lg:mx-auto lg:max-w-xl"
      >
        <div className="flex items-center justify-between px-margin pt-space-sm">
          <SheetTitle className="text-headline-md">Lưu cảm hứng</SheetTitle>
          <SheetClose
            aria-label="Đóng"
            className="inline-flex size-touch-target items-center justify-center rounded-full hover:bg-surface-container"
          >
            <X className="size-5" aria-hidden />
          </SheetClose>
        </div>
        <div className="px-margin pb-space-md">
          <InspirationForm
            autoFocus
            onSaved={() => {
              setOpen(false);
              router.replace("/cms/cam-hung", { scroll: false });
              router.refresh();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
