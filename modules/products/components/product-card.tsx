import { ExternalLink, Pin } from "lucide-react";
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
      {/* "cập nhật dd/mm/yyyy" không gãy giữa chừng ở màn hẹp (390px). */}
      {date && (
        <>
          {" · "}
          <span className="whitespace-nowrap">cập nhật {date}</span>
        </>
      )}
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
// Dấu Ghim (Trang bio, DESIGN.md › ProductCard): icon pin trên nền `primary-fixed`, chữ ẩn "Nổi bật".
function PinnedMark() {
  return (
    <span className="absolute top-1 left-1 flex size-6 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
      <Pin className="size-3.5" strokeWidth={1.5} aria-hidden />
      <span className="sr-only">Nổi bật</span>
    </span>
  );
}

// *row*: trong bài viết; *bio*: `/bio` (Stitch [Bio-M], Vinh 2026-11-09); *tile*: dải "Gom link đồ xinh" Trang chủ.
// `pinned`: món ghim trên `/bio`.
export function ProductCard({
  product,
  variant = "row",
  pinned = false,
}: {
  product: PublicProduct;
  variant?: "row" | "bio" | "tile";
  pinned?: boolean;
}) {
  if (variant === "tile") {
    return (
      <AffiliateLink href={product.affiliateUrl} className={cn(CARD, "flex w-40 flex-col gap-space-sm p-space-sm lg:w-full")}>
        <span className="relative block aspect-square overflow-hidden rounded-lg bg-surface-container">
          <ImageFallback src={product.image} alt="" fill sizes="(min-width: 1024px) 25vw, 160px" className="object-cover" />
        </span>
        <span className="line-clamp-2 text-headline-sm">{product.name}</span>
        <ReferencePrice priceText={product.priceText} priceUpdatedAt={product.priceUpdatedAt} />
        <ShopeeButton className="mt-auto w-full" />
      </AffiliateLink>
    );
  }
  if (variant === "bio") {
    // Ảnh 96px; tên 2 dòng; "Giá tham khảo · cập nhật dd/mm/yyyy"; hàng dưới giá to bên trái + nút Shopee bên phải
    // (màn hẹp thì nút xuống dòng). Không có giá: chỉ nút.
    const date = formatShortDate(product.priceUpdatedAt);
    return (
      <AffiliateLink href={product.affiliateUrl} className={cn(CARD, "flex items-center gap-space-sm px-space-sm py-space-md")}>
        <span className="relative block size-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
          <ImageFallback src={product.image} alt="" fill sizes="96px" className="object-cover" />
          {pinned && <PinnedMark />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-space-xs">
          <span className="line-clamp-2 text-headline-sm">{product.name}</span>
          {/* Dòng nhãn chỉ để nhìn; trình đọc màn hình đọc "Giá tham khảo ~X · cập nhật …" ở giá bên dưới (UX-DR35). */}
          {product.priceText && (
            <span aria-hidden className="block text-label-meta text-on-surface-variant">
              Giá tham khảo
              {date && (
                <>
                  {" · "}
                  <span className="whitespace-nowrap">cập nhật {date}</span>
                </>
              )}
            </span>
          )}
          <span className="flex flex-wrap items-center justify-between gap-x-space-xs gap-y-space-xs">
            {product.priceText && (
              <span className="text-headline-sm text-primary">
                <span className="sr-only">Giá tham khảo </span>
                {product.priceText}
                {date && <span className="sr-only"> · cập nhật {date}</span>}
              </span>
            )}
            <ShopeeButton className="ml-auto shrink-0" />
          </span>
        </span>
      </AffiliateLink>
    );
  }
  return (
    <AffiliateLink href={product.affiliateUrl} className={cn(CARD, "flex gap-space-md p-space-md")}>
      <span className="relative block size-20 shrink-0 overflow-hidden rounded-lg bg-surface-container">
        <ImageFallback src={product.image} alt="" fill sizes="80px" className="object-cover" />
        {pinned && <PinnedMark />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-space-xs">
        <span className="line-clamp-2 text-headline-sm">{product.name}</span>
        <ReferencePrice priceText={product.priceText} priceUpdatedAt={product.priceUpdatedAt} />
        <ShopeeButton className="mt-space-xs" />
      </span>
    </AffiliateLink>
  );
}
