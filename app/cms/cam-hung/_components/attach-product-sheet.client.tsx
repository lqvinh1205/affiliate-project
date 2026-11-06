"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PackagePlus, Plus, X } from "lucide-react";
import { INSPIRATION_PARAM } from "@/modules/inspirations/constants";
import type { PickerProduct } from "@/modules/products/types";
import { ProductPicker } from "@/modules/products/components/product-picker.client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// "Gắn sản phẩm" (InspirationActions, UX-DR61): Sheet hai lựa chọn — "Tạo Sản phẩm mới" (màn tạo kèm `?cam-hung=`) hoặc
// "Chọn Sản phẩm có sẵn" (ProductPicker, chọn một món → Chi tiết Sản phẩm kèm `?cam-hung=`). Liên kết chỉ ghi khi tạo
// Bộ nội dung ở Chi tiết Sản phẩm (FR-2). Ô tìm của ProductPicker đưa từ khoá lên `?sp=` (AD-12): đang có từ khoá thì
// Sheet mở sẵn để thấy kết quả.
export function AttachProductSheet({
  inspirationId,
  pickerResults,
  pickerQuery,
}: {
  inspirationId: string;
  pickerResults: PickerProduct[];
  pickerQuery: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(pickerQuery !== "");
  const query = `${INSPIRATION_PARAM}=${encodeURIComponent(inspirationId)}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button type="button" size="lg" className="w-full lg:w-auto" />}>
        <PackagePlus aria-hidden /> Gắn sản phẩm
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90dvh] gap-0 overflow-y-auto rounded-t-xl bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] lg:mx-auto lg:max-w-xl"
      >
        <div className="flex items-center justify-between px-margin pt-space-sm">
          <SheetTitle className="text-headline-md">Gắn sản phẩm</SheetTitle>
          <SheetClose
            aria-label="Đóng"
            className="inline-flex size-touch-target items-center justify-center rounded-full hover:bg-surface-container"
          >
            <X className="size-5" aria-hidden />
          </SheetClose>
        </div>
        <div className="space-y-space-lg px-margin pb-space-md">
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Tìm Sản phẩm trên Shopee bằng từ khoá, tạo Link affiliate rồi gắn vào đây. Bộ nội dung tạo từ Sản phẩm đó sẽ
            ghi lại Cảm hứng này.
          </SheetDescription>
          <Link
            href={`/cms/san-pham/moi?${query}`}
            className={cn(buttonVariants({ size: "lg" }), "min-h-touch-target w-full")}
          >
            <Plus aria-hidden /> Tạo Sản phẩm mới
          </Link>
          <ProductPicker
            id="inspiration-product-search"
            value={[]}
            onChange={(next) => {
              const picked = next[0];
              if (picked) router.push(`/cms/san-pham/${picked.id}?${query}`);
            }}
            results={pickerResults}
            query={pickerQuery}
            showValue={false}
            noun="Cảm hứng"
            addLabel="Chọn Sản phẩm có sẵn"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
