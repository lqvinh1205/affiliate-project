import { Suspense } from "react";
import { postTypeMetadata } from "@/app/(site)/_components/post-type-route";
import { PostTypeScreen } from "@/app/(site)/_components/post-type-screen";
import { PostListSkeleton } from "@/app/(site)/_components/post-list-skeleton";

export const metadata = postTypeMetadata("GOM_LINK", 1);

export default function GomLinkPage() {
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostTypeScreen postType="GOM_LINK" page={1} />
    </Suspense>
  );
}
