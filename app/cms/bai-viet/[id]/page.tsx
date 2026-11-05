import type { Metadata } from "next";
import { Suspense } from "react";
import { PostEditScreen } from "@/app/cms/bai-viet/_components/post-edit-screen";
import { PostFormSkeleton } from "@/app/cms/bai-viet/_components/post-form-skeleton";

export const metadata: Metadata = { title: "Sửa Bài web" };

export default function EditPostPage({ params, searchParams }: PageProps<"/cms/bai-viet/[id]">) {
  return (
    <Suspense fallback={<PostFormSkeleton />}>
      <PostEditScreen params={params} searchParams={searchParams} />
    </Suspense>
  );
}
