import type { Metadata } from "next";
import { Suspense } from "react";
import { parsePageParam } from "@/app/(site)/_components/pagination-items";
import { loadPostTypePage, postTypeMetadata, postTypeStaticParams } from "@/app/(site)/_components/post-type-route";
import { PostTypeScreen } from "@/app/(site)/_components/post-type-screen";
import { PostListSkeleton } from "@/app/(site)/_components/post-list-skeleton";

export function generateStaticParams() {
  return postTypeStaticParams("MEO_VAT");
}

export async function generateMetadata({ params }: PageProps<"/meo-vat/trang/[n]">): Promise<Metadata> {
  const page = parsePageParam((await params).n);
  return page ? postTypeMetadata("MEO_VAT", page) : {};
}

export default async function MeoVatPagedPage({ params }: PageProps<"/meo-vat/trang/[n]">) {
  const { page, data } = await loadPostTypePage("MEO_VAT", (await params).n);
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostTypeScreen postType="MEO_VAT" page={page} data={data} />
    </Suspense>
  );
}
