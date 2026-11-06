import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSetScreen } from "@/app/cms/bo-noi-dung/_components/content-set-screen";
import { ContentSetSkeleton } from "@/app/cms/bo-noi-dung/_components/content-set-skeleton";

export const metadata: Metadata = { title: "Bộ nội dung" };

export default function ContentSetPage({ params }: PageProps<"/cms/bo-noi-dung/[id]">) {
  return (
    <Suspense fallback={<ContentSetSkeleton />}>
      <ContentSetScreen params={params} />
    </Suspense>
  );
}
