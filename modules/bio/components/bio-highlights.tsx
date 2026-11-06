import Link from "next/link";
import type { PublicProduct } from "@/modules/products/types";
import { AffiliateDisclosure } from "@/modules/products/components/affiliate-disclosure";
import { ProductCard } from "@/modules/products/components/product-card";
import { BIO_HIGHLIGHTS_DISCLOSURE } from "@/modules/bio/constants";

// Khu "Gom link đồ xinh" Trang chủ (UX-DR62, Story 6.3): tiêu đề + "Xem tất cả" → `/bio`, dòng AffiliateDisclosure ngắn
// dưới tiêu đề, dải ProductCard *tile* cuộn ngang snap trên mobile (thẻ 160px), lưới 4 cột từ desktop. Không có món →
// không render (nơi gọi không chừa chỗ).
export function BioHighlights({ products }: { products: PublicProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="gom-link-do-xinh">
      <div className="mb-space-sm flex items-end justify-between gap-space-md border-b pb-space-sm">
        <h2 id="gom-link-do-xinh" className="text-headline-md">
          Gom link đồ xinh
        </h2>
        <Link href="/bio" className="inline-flex min-h-touch-target shrink-0 items-center text-label-md text-primary hover:underline">
          Xem tất cả<span className="sr-only"> đồ hay</span>
        </Link>
      </div>
      <div className="mb-space-md">
        <AffiliateDisclosure variant="text" sentence={BIO_HIGHLIGHTS_DISCLOSURE} />
      </div>
      <ul className="-mx-margin flex snap-x snap-mandatory scroll-px-margin gap-gutter overflow-x-auto px-margin pb-space-xs [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-gutter-desktop lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <li key={p.id} className="flex shrink-0 snap-start lg:block">
            <ProductCard product={p} variant="tile" />
          </li>
        ))}
      </ul>
    </section>
  );
}
