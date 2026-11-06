import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBioPage } from "@/modules/bio/queries";
import { BioBrowser } from "@/modules/bio/components/bio-browser.client";
import { AffiliateDisclosure } from "@/modules/products/components/affiliate-disclosure";
import { EmptyState } from "@/components/shared/empty-state";

// Màn `/bio` (FR-30, UX-DR66): một cột, desktop căn giữa ≤ 560px. (1) giới thiệu + "Về trang chủ" (link tuỳ chỉnh duy
// nhất) → (2) AffiliateDisclosure luôn hiện → (3) FilterChips → (4) ProductCard *row*. Rỗng: EmptyState. Không ô tìm,
// không link MXH/@handle, không "Bài mới nhất" (UX-DR99).
export async function BioScreen() {
  const { intro, disclosure, items, categories } = await getBioPage();
  return (
    <div className="mx-auto max-w-[560px] space-y-space-lg px-margin py-space-lg">
      <header className="space-y-space-sm">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg">Đồ hay</h1>
        <p className="text-body-regular whitespace-pre-line text-on-surface-variant">{intro}</p>
        <Link
          href="/"
          className="inline-flex min-h-touch-target items-center gap-space-xs text-label-md text-primary hover:underline"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
          Về trang chủ
        </Link>
      </header>
      <AffiliateDisclosure sentence={disclosure} />
      {items.length === 0 ? (
        <EmptyState title="Sắp có đồ hay, ghé lại sau nhé" description="Mình đang chọn những món đáng mua nhất cho bạn." />
      ) : (
        <BioBrowser
          items={items.map((p) => ({ ...p, priceUpdatedAt: p.priceUpdatedAt?.toISOString() ?? null }))}
          categories={categories}
        />
      )}
    </div>
  );
}
