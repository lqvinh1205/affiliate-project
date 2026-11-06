import type { Metadata } from "next";
import { Suspense } from "react";
import { InspirationDetailScreen } from "@/app/cms/cam-hung/_components/inspiration-detail-screen";
import { InspirationDetailSkeleton } from "@/app/cms/cam-hung/_components/inspiration-detail-skeleton";

export const metadata: Metadata = { title: "Cảm hứng" };

export default function InspirationPage({ params, searchParams }: PageProps<"/cms/cam-hung/[id]">) {
  return (
    <Suspense fallback={<InspirationDetailSkeleton />}>
      <InspirationDetailScreen params={params} searchParams={searchParams} />
    </Suspense>
  );
}
