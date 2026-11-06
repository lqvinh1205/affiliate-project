import Link from "next/link";
import { Lightbulb } from "lucide-react";

// Dải "Từ Cảm hứng: …" (UX-DR47, UX-DR61) ở màn Sản phẩm mở kèm `?cam-hung=<id>`: nhắc Sản phẩm đang làm cho Cảm hứng
// nào, link về Chi tiết Cảm hứng. Không có trạng thái riêng, dùng được trong cả Server và Client Component.
export function InspirationStrip({ id, label }: { id: string; label: string }) {
  return (
    <p className="flex items-start gap-space-sm rounded-lg bg-tertiary-fixed px-space-sm py-2 text-body-sm text-on-tertiary-fixed">
      <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="min-w-0">
        Từ Cảm hứng:{" "}
        <Link href={`/cms/cam-hung/${id}`} className="font-medium break-words underline underline-offset-4">
          {label}
        </Link>
      </span>
    </p>
  );
}
