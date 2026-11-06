import type { LiveBanner } from "@/modules/banners/types";
import { BannerCard } from "@/modules/banners/components/banner-card";
import { BannerStrip } from "@/modules/banners/components/banner-strip.client";

// Khu Banner đầu Trang chủ (UX-DR15, UX-DR62): 0 Banner → không render, không chừa chỗ (Bài nổi bật lên đầu);
// 1 Banner → một thẻ; ≥ 2 → dải cuộn ngang có chấm vị trí.
export function BannerSection({ banners }: { banners: LiveBanner[] }) {
  if (banners.length === 0) return null;
  return (
    <section aria-label="Khuyến mãi">
      {banners.length === 1 ? (
        <BannerCard banner={banners[0]} preload />
      ) : (
        <BannerStrip
          slides={banners.map((b, i) => (
            <BannerCard key={b.id} banner={b} preload={i === 0} />
          ))}
          titles={banners.map((b) => b.title)}
        />
      )}
    </section>
  );
}
