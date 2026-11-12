import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_OPEN_GRAPH } from "@/platform/site";
import { BioScreen } from "@/app/(site)/bio/_components/bio-screen";
import { BioSkeleton } from "@/app/(site)/bio/_components/bio-skeleton";

// Trang bio: canonical chính nó, không JSON-LD, có sitemap (AD-26). Tên "Đồ hay" cho mọi lối vào `/bio` (EXPERIENCE).
export const metadata: Metadata = {
  title: "Đồ hay",
  description: "Những món đồ nhà bếp, dọn dẹp, ở trọ đáng mua, gom link Shopee theo Danh mục.",
  alternates: { canonical: "/bio" },
  openGraph: { ...SITE_OPEN_GRAPH, url: "/bio" },
};

export default function BioPage() {
  return (
    <Suspense fallback={<BioSkeleton />}>
      <BioScreen />
    </Suspense>
  );
}
