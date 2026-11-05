import type { Metadata } from "next";
import { Suspense } from "react";
import { parsePageParam } from "@/app/(site)/_components/pagination-items";
import { loadPostTypePage, postTypeMetadata, postTypeStaticParams } from "@/app/(site)/_components/post-type-route";
import { PostTypeScreen } from "@/app/(site)/_components/post-type-screen";
import { PostListSkeleton } from "@/app/(site)/_components/post-list-skeleton";

export function generateStaticParams() {
  return postTypeStaticParams("GOM_LINK");
}

export async function generateMetadata({ params }: PageProps<"/gom-link/trang/[n]">): Promise<Metadata> {
  const page = parsePageParam((await params).n);
  return page ? postTypeMetadata("GOM_LINK", page) : {};
}

export default async function GomLinkPagedPage({ params }: PageProps<"/gom-link/trang/[n]">) {
  const { page, data } = await loadPostTypePage("GOM_LINK", (await params).n);
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostTypeScreen postType="GOM_LINK" page={page} data={data} />
    </Suspense>
  );
}
