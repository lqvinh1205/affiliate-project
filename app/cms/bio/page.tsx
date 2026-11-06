import type { Metadata } from "next";
import { Suspense } from "react";
import { BioCmsScreen } from "@/app/cms/bio/_components/bio-cms-screen";
import { BioCmsSkeleton } from "@/app/cms/bio/_components/bio-cms-skeleton";

export const metadata: Metadata = { title: "Trang bio" };

export default function BioCmsPage() {
  return (
    <Suspense fallback={<BioCmsSkeleton />}>
      <BioCmsScreen />
    </Suspense>
  );
}
