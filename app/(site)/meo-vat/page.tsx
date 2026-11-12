import type { Metadata } from "next";
import { Suspense } from "react";
import { postTypeMetadata } from "@/app/(site)/_components/post-type-route";
import { PostTypeScreen } from "@/app/(site)/_components/post-type-screen";
import { PostListSkeleton } from "@/app/(site)/_components/post-list-skeleton";

export function generateMetadata(): Promise<Metadata> {
  return postTypeMetadata("MEO_VAT", 1);
}

export default function MeoVatPage() {
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostTypeScreen postType="MEO_VAT" page={1} />
    </Suspense>
  );
}
