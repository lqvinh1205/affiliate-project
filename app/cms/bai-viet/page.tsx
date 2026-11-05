import type { Metadata } from "next";
import { Suspense } from "react";
import { PostListScreen } from "@/app/cms/bai-viet/_components/post-list-screen";
import { PostListSkeleton } from "@/app/cms/bai-viet/_components/post-list-skeleton";

export const metadata: Metadata = { title: "Bài web" };

export default function PostsPage({ searchParams }: PageProps<"/cms/bai-viet">) {
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostListScreen searchParams={searchParams} />
    </Suspense>
  );
}
