import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { AffiliateLink } from "@/modules/products/components/affiliate-link";
import { bannerLinkKind } from "@/modules/banners/link";
import type { LiveBanner } from "@/modules/banners/types";
import { ImageFallback } from "@/components/shared/image-fallback.client";

const CARD =
  "group flex h-full flex-col overflow-hidden rounded-xl bg-surface-container-low outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary md:flex-row";

// Banner (UX-DR15, DESIGN.md › Banner): cả thẻ là **một** link — đích Shopee qua `AffiliateLink` (tab mới, FR-25), đích
// trong site là link thường cùng tab. Ảnh trên (mobile) / trái (từ md), tỉ lệ 2:1 cố định (không nhảy bố cục), `alt=""`
// vì tiêu đề đã có trong link; ảnh lỗi → ImageFallback. Nhãn nhỏ `tertiary-fixed`, CTA pill `primary` chỉ là hình.
// `preload`: Banner đầu tiên nằm đầu Trang chủ (ảnh LCP).
export function BannerCard({ banner, preload = false }: { banner: LiveBanner; preload?: boolean }) {
  const shopee = bannerLinkKind(banner.linkUrl) === "shopee";
  const body = (
    <>
      <span className="relative block aspect-[2/1] w-full shrink-0 overflow-hidden bg-surface-container md:w-2/5">
        <ImageFallback
          src={banner.image}
          alt=""
          fill
          sizes="(min-width: 768px) 40vw, 90vw"
          preload={preload}
          className="object-cover"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-space-xs p-space-md">
        <span className="self-start rounded bg-tertiary-fixed px-1.5 py-0.5 text-label-meta text-on-tertiary-fixed">
          Khuyến mãi
        </span>
        <span className="line-clamp-2 text-body-sm font-medium text-on-surface">{banner.title}</span>
        {banner.description && (
          <span className="line-clamp-2 text-body-sm text-on-surface-variant">{banner.description}</span>
        )}
        <span className="mt-auto inline-flex h-7 items-center gap-1 self-start rounded-full bg-primary px-3 text-label-sm text-on-primary group-hover:opacity-95">
          {shopee ? "Xem trên Shopee" : "Xem ngay"}
          {shopee ? (
            <ExternalLink className="size-3.5" strokeWidth={1.5} aria-hidden />
          ) : (
            <ArrowRight className="size-3.5" strokeWidth={1.5} aria-hidden />
          )}
          {shopee && <span className="sr-only">, mở Shopee trong tab mới</span>}
        </span>
      </span>
    </>
  );
  return shopee ? (
    <AffiliateLink href={banner.linkUrl} className={CARD}>
      {body}
    </AffiliateLink>
  ) : (
    <Link href={banner.linkUrl} className={CARD}>
      {body}
    </Link>
  );
}
