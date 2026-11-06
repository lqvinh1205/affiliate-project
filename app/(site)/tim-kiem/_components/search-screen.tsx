import Link from "next/link";
import { Suspense } from "react";
import { listNavCategories } from "@/modules/posts/queries";
import { PostSearch, PostSearchFromUrl } from "@/modules/posts/components/post-search.client";
import { POPULAR_POSTS_LIMIT } from "@/modules/engagement/constants";
import { getPopularPosts } from "@/modules/engagement/queries";
import { PopularPostList } from "@/modules/engagement/components/popular-post-list";
import { CHIP_BASE, CHIP_IDLE, CHIP_ROW } from "@/components/shared/chip-styles";

// Màn Tìm kiếm `/tim-kiem` (UX-DR67, FR-36). Chưa gõ: SearchBox tự focus + chip mỗi Danh mục có Bài web đã xuất bản
// (không "Tất cả", không số), chạm → `/[danh-muc]` (UX-DR30). Không có kết quả: kèm "Chủ đề được đọc nhiều nhất"
// (Xem nhiều). Phần tìm là Client Component; bản dựng sẵn (fallback của `<Suspense>`) là trạng thái chưa gõ, `?q=` đọc
// phía client (AD-7).
export async function SearchScreen() {
  const [categories, popular] = await Promise.all([listNavCategories(), getPopularPosts(POPULAR_POSTS_LIMIT)]);

  const idle =
    categories.length > 0 ? (
      <nav aria-labelledby="chu-de" className="space-y-space-sm">
        <h2 id="chu-de" className="text-label-md text-on-surface-variant">
          Xem theo chủ đề
        </h2>
        <ul className={CHIP_ROW}>
          {categories.map((c) => (
            <li key={c.slug} className="shrink-0">
              <Link href={`/${c.slug}`} className={`${CHIP_BASE} ${CHIP_IDLE}`}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    ) : null;

  const noResults =
    popular.length > 0 ? (
      <section aria-labelledby="doc-nhieu-nhat">
        <h2 id="doc-nhieu-nhat" className="border-b pb-space-sm text-headline-md lg:text-headline-lg">
          Chủ đề được đọc nhiều nhất
        </h2>
        <PopularPostList posts={popular} />
      </section>
    ) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-space-md px-margin py-space-lg">
      <h1 className="text-headline-lg-mobile lg:text-headline-lg">Tìm kiếm</h1>
      <Suspense fallback={<PostSearch initialQuery="" idle={idle} noResults={noResults} />}>
        <PostSearchFromUrl idle={idle} noResults={noResults} />
      </Suspense>
    </div>
  );
}
