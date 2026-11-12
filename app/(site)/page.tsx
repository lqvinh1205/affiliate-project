import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_OPEN_GRAPH } from "@/platform/site";
import { HomeScreen } from "@/app/(site)/_components/home-screen";
import { HomeSkeleton } from "@/app/(site)/_components/home-skeleton";

// Trang chủ: canonical chính nó, không JSON-LD (AD-26); title mặc định ở `app/layout.tsx`.
export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { ...SITE_OPEN_GRAPH, url: "/" } };

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeScreen />
    </Suspense>
  );
}
