import type { Metadata } from "next";
import { Suspense } from "react";
import { InspirationListScreen } from "@/app/cms/cam-hung/_components/inspiration-list-screen";
import { InspirationListSkeleton } from "@/app/cms/cam-hung/_components/inspiration-list-skeleton";

export const metadata: Metadata = { title: "Cảm hứng" };

export default function InspirationsPage({ searchParams }: PageProps<"/cms/cam-hung">) {
  return (
    <Suspense fallback={<InspirationListSkeleton />}>
      <InspirationListScreen searchParams={searchParams} />
    </Suspense>
  );
}
