import { Suspense } from "react";
import { HomeScreen } from "@/app/(site)/_components/home-screen";
import { PostListSkeleton } from "@/app/(site)/_components/post-list-skeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <HomeScreen />
    </Suspense>
  );
}
