import Link from "next/link";
import { ArrowRight, House } from "lucide-react";
import { getBioPage } from "@/modules/bio/queries";
import { BioBrowser } from "@/modules/bio/components/bio-browser.client";
import { AffiliateDisclosure } from "@/modules/products/components/affiliate-disclosure";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageFallback } from "@/components/shared/image-fallback.client";

// Màn `/bio` (FR-30, UX-DR66, bố cục Stitch theo Vinh 2026-11-06): một cột, desktop căn giữa ≤ 560px.
// (1) đầu trang căn giữa: ảnh đại diện (nếu có) + "Đồ hay" + giới thiệu → (2) AffiliateDisclosure luôn hiện, trước mọi
// Link affiliate (FR-24) → (3) dòng Danh mục + nhóm "Nổi bật" (BioBrowser) → (4) thẻ "Ghé thăm Website" về Trang chủ
// (link tuỳ chỉnh duy nhất). Rỗng: EmptyState. Không ô tìm, không tick, @handle, link MXH, emoji, "Bài mới nhất" (UX-DR99).
export async function BioScreen() {
  const { intro, disclosure, avatar, items, categories } = await getBioPage();
  return (
    <div className="mx-auto max-w-[560px] space-y-space-lg px-margin py-space-lg">
      <header className="flex flex-col items-center gap-space-sm text-center">
        {avatar && (
          <span className="relative block size-20 overflow-hidden rounded-2xl bg-surface-container shadow-level-0">
            <ImageFallback src={avatar} alt="" fill sizes="80px" className="object-cover" fetchPriority="high" />
          </span>
        )}
        <h1 className="text-headline-lg-mobile lg:text-headline-lg">Đồ hay</h1>
        <p className="text-body-regular whitespace-pre-line text-on-surface-variant">{intro}</p>
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
      <Link
        href="/"
        className="flex min-h-touch-target items-center gap-space-md rounded-xl bg-primary-container p-space-md text-on-primary-container shadow-level-0 outline-offset-2 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-on-primary-container/15">
          <House className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-headline-sm">Ghé thăm Website</span>
          <span className="block text-body-sm">Mẹo vặt, gom link và cẩm nang tổ ấm</span>
        </span>
        <ArrowRight className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
      </Link>
    </div>
  );
}
