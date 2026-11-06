import Link from "next/link";
import { POPULAR_POSTS_LIMIT, POPULAR_POSTS_NOT_FOUND } from "@/modules/engagement/constants";
import { getPopularPosts } from "@/modules/engagement/queries";
import { PopularPostList } from "@/modules/engagement/components/popular-post-list";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { SearchLauncher } from "@/app/(site)/_components/search-launcher.client";

// 404 của site (UX-DR68, UX-DR33), dùng chung cho `app/(site)/not-found.tsx` và `app/not-found.tsx` (AD-12):
// EmptyState + SearchBox + 3 bài Xem nhiều (lấy từ cùng mục cache 5 bài của Trang chủ; chưa có bài nào thì ẩn khu).
export async function NotFoundScreen() {
  const popular = (await getPopularPosts(POPULAR_POSTS_LIMIT)).slice(0, POPULAR_POSTS_NOT_FOUND);
  return (
    <div className="mx-auto w-full max-w-2xl pb-space-xl">
      <EmptyState
        titleAs="h1"
        title="Trang này không còn ở đây"
        description="Có thể bài đã được gỡ hoặc đường dẫn bị gõ nhầm. Thử tìm mẹo bạn cần, hoặc quay về Trang chủ đọc mẹo mới nhé."
      >
        <Link href="/" className={buttonVariants({ size: "lg", className: "min-h-touch-target" })}>
          Về Trang chủ
        </Link>
      </EmptyState>
      <div className="space-y-space-xl px-margin">
        <SearchLauncher />
        {popular.length > 0 && (
          <section aria-labelledby="xem-nhieu-404">
            <h2 id="xem-nhieu-404" className="border-b pb-space-sm text-headline-md lg:text-headline-lg">
              Xem nhiều
            </h2>
            <PopularPostList posts={popular} />
          </section>
        )}
      </div>
    </div>
  );
}
