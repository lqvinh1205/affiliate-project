import { ExternalLink } from "lucide-react";
import { formatShortDate } from "@/platform/format";
import type { PublicProduct } from "@/modules/products/types";
import { AffiliateLink } from "@/modules/products/components/affiliate-link";
import { ImageFallback } from "@/components/shared/image-fallback.client";
import { cn } from "@/components/ui/lib/utils";

// Dòng giá (UX-DR95): "Giá tham khảo ~89.000đ · cập nhật dd/mm/yyyy"; không có giá thì không render.
function ReferencePrice({ priceText, priceUpdatedAt }: Pick<PublicProduct, "priceText" | "priceUpdatedAt">) {
  if (!priceText) return null;
  const date = formatShortDate(priceUpdatedAt);
  return (
    <span className="block text-label-meta text-on-surface-variant">
      Giá tham khảo <span className="text-headline-sm text-primary">{priceText}</span>
      {date && ` · cập nhật ${date}`}
    </span>
  );
}

// Hình "nút Shopee" (DESIGN.md › affiliate-link-button): chỉ là hình, vùng bấm là cả thẻ.
function ShopeeButton({ className }: { className?: string }) {
  return (
    // Ghép chuỗi thường: `cn` (tailwind-merge) coi `text-label-sm` và `text-on-primary-container` cùng nhóm.
    <span
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 text-label-sm text-on-primary-container group-hover:opacity-95 ${className ?? ""}`}
    >
      Xem trên Shopee
      <ExternalLink className="size-3.5" strokeWidth={1.5} aria-hidden />
      <span className="sr-only">, mở Shopee trong tab mới</span>
    </span>
  );
}

const CARD =
  "group rounded-xl bg-surface-container-lowest shadow-level-0 outline-offset-2 hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary";

// ProductCard (UX-DR20, UX-DR35): cả thẻ là một `<a>` (AffiliateLink), không phần tử bấm lồng; tên truy cập đọc
// tên → giá → "Xem trên Shopee, mở Shopee trong tab mới"; ảnh `alt=""` vì tên đã có trong link.
// *row*: trong bài viết, `/bio`; *tile*: dải "Gom link đồ xinh" Trang chủ.
export function ProductCard({ product, variant = "row" }: { product: PublicProduct; variant?: "row" | "tile" }) {
  if (variant === "tile") {
    return (
      <AffiliateLink href={product.affiliateUrl} className={cn(CARD, "flex w-40 flex-col gap-space-sm p-space-sm lg:w-auto")}>
        <span className="relative block aspect-square overflow-hidden rounded-lg bg-surface-container">
          <ImageFallback src={product.image} alt="" fill sizes="(min-width: 1024px) 25vw, 160px" className="object-cover" />
        </span>
        <span className="line-clamp-2 text-headline-sm">{product.name}</span>
        <ReferencePrice priceText={product.priceText} priceUpdatedAt={product.priceUpdatedAt} />
        <ShopeeButton className="mt-auto w-full" />
      </AffiliateLink>
    );
  }
  return (
    <AffiliateLink href={product.affiliateUrl} className={cn(CARD, "flex gap-space-md p-space-md")}>
      <span className="relative block size-20 shrink-0 overflow-hidden rounded-lg bg-surface-container">
        <ImageFallback src={product.image} alt="" fill sizes="80px" className="object-cover" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-space-xs">
        <span className="line-clamp-2 text-headline-sm">{product.name}</span>
        <ReferencePrice priceText={product.priceText} priceUpdatedAt={product.priceUpdatedAt} />
        <ShopeeButton className="mt-space-xs" />
      </span>
    </AffiliateLink>
  );
}
