import type { Metadata } from "next";
import { Suspense } from "react";
import { PostCreateScreen } from "@/app/cms/bai-viet/_components/post-create-screen";
import { PostFormSkeleton } from "@/app/cms/bai-viet/_components/post-form-skeleton";

export const metadata: Metadata = { title: "Tạo Bài web" };

export default function NewPostPage() {
  return (
    <Suspense fallback={<PostFormSkeleton />}>
      <PostCreateScreen />
    </Suspense>
  );
}
