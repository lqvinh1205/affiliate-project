import type { Metadata } from "next";
import { Suspense } from "react";
import { BannerListScreen } from "@/app/cms/banner/_components/banner-list-screen";
import { BannerListSkeleton } from "@/app/cms/banner/_components/banner-list-skeleton";

export const metadata: Metadata = { title: "Banner" };

export default function BannersPage() {
  return (
    <Suspense fallback={<BannerListSkeleton />}>
      <BannerListScreen />
    </Suspense>
  );
}
