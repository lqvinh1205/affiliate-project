import type { Metadata } from "next";
import { Suspense } from "react";
import { StyleProfilesScreen } from "@/app/cms/phong-cach/_components/style-profiles-screen";
import { StyleProfilesSkeleton } from "@/app/cms/phong-cach/_components/style-profiles-skeleton";

export const metadata: Metadata = { title: "Hồ sơ phong cách" };

export default function StyleProfilesPage() {
  return (
    <Suspense fallback={<StyleProfilesSkeleton />}>
      <StyleProfilesScreen />
    </Suspense>
  );
}
