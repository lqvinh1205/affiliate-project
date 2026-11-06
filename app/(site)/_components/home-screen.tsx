import Link from "next/link";
import { SITE_NAME } from "@/platform/site";
import { POST_TYPES } from "@/modules/posts/constants";
import { getLatestPosts, getPostsByType } from "@/modules/posts/queries";
import { PostCard } from "@/modules/posts/components/post-card";
import { BIO_HIGHLIGHTS_LIMIT } from "@/modules/bio/constants";
import { getBioHighlights } from "@/modules/bio/queries";
import { BioHighlights } from "@/modules/bio/components/bio-highlights";
import { POPULAR_POSTS_LIMIT } from "@/modules/engagement/constants";
import { getPopularPosts } from "@/modules/engagement/queries";
import { PopularPostList } from "@/modules/engagement/components/popular-post-list";
import type { PostCardData } from "@/modules/posts/types";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/app/(site)/_components/section-heading";

// Số bài khu "Mới cập nhật" (không tính Bài nổi bật) và "Mẹo vặt hay".
const LATEST_COUNT = 6;
const MEO_VAT_COUNT = 4;

const TYPE_LINK =
  "inline-flex min-h-touch-target items-center rounded-full border px-space-md text-label-md hover:border-primary hover:text-primary";

// Khu "Xem nhiều" (FR-34): tối đa 5 bài, không "Xem tất cả" (không có route "mọi bài"). `id` riêng cho bản mobile
// và bản desktop (chỉ một bản hiện — bản kia `display: none`, không vào cây truy cập).
function PopularSection({ posts, id, className }: { posts: PostCardData[]; id: string; className: string }) {
  return (
    <section aria-labelledby={id} className={className}>
      <SectionHeading id={id} title="Xem nhiều" />
      <PopularPostList posts={posts} />
    </section>
  );
}

// Màn Trang chủ (UX-DR62): Bài nổi bật (PostCard *featured*, bài xuất bản mới nhất) → Gom link đồ xinh (≤ 8 món theo
// thứ tự bio) → Xem nhiều (≤ 5 bài nhiều Lượt xem nhất 30 ngày, PostCard *rank*) → Mới cập nhật (bỏ bài nổi bật; cuối
// khu link "Mẹo vặt", "Gom link") → Mẹo vặt hay (PostCard *row*, "Xem tất cả" → `/meo-vat`). Desktop: Bài nổi bật
// (7 cột) + Xem nhiều (5 cột) cạnh nhau rồi tới Gom link đồ xinh — Xem nhiều dựng hai chỗ (mobile / desktop) để thứ
// tự đọc và Tab đúng ở cả hai. Banner thuộc epic sau: chưa render, không chừa chỗ. Khu rỗng thì ẩn. Không JSON-LD
// (AD-26).
export async function HomeScreen() {
  const [latest, meoVat, highlights, popular] = await Promise.all([
    getLatestPosts(LATEST_COUNT + 1),
    getPostsByType("MEO_VAT", MEO_VAT_COUNT),
    getBioHighlights(BIO_HIGHLIGHTS_LIMIT),
    getPopularPosts(POPULAR_POSTS_LIMIT),
  ]);
  const [featured, ...rest] = latest;

  return (
    <div className="mx-auto max-w-container-max space-y-space-xl px-margin py-space-lg lg:px-margin-desktop lg:py-space-xl">
      <h1 className="sr-only">{SITE_NAME}</h1>
      {!featured ? (
        <>
          <EmptyState title="Chưa có bài viết nào" description="Mình đang viết những mẹo đầu tiên, bạn ghé lại sau nhé." />
          <BioHighlights products={highlights} />
        </>
      ) : (
        <>
          <div className="lg:grid lg:grid-cols-12 lg:gap-gutter-desktop">
            <section aria-label="Bài nổi bật" className={popular.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
              <PostCard post={featured} variant="featured" headingLevel="h2" preload />
            </section>
            {popular.length > 0 && (
              <PopularSection posts={popular} id="xem-nhieu-desktop" className="hidden lg:col-span-5 lg:block" />
            )}
          </div>

          <BioHighlights products={highlights} />

          {popular.length > 0 && <PopularSection posts={popular} id="xem-nhieu" className="lg:hidden" />}

          {rest.length > 0 && (
            <section aria-labelledby="moi-cap-nhat">
              <SectionHeading id="moi-cap-nhat" title="Mới cập nhật" />
              <ul className="grid gap-gutter md:grid-cols-2 lg:grid-cols-3 lg:gap-gutter-desktop">
                {rest.map((p) => (
                  <li key={p.slug}>
                    <PostCard post={p} />
                  </li>
                ))}
              </ul>
              <nav aria-label="Xem theo Loại bài" className="mt-space-lg flex flex-wrap gap-space-sm">
                {Object.values(POST_TYPES).map((t) => (
                  <Link key={t.slug} href={`/${t.slug}`} className={TYPE_LINK}>
                    {t.label}
                  </Link>
                ))}
              </nav>
            </section>
          )}

          {meoVat.length > 0 && (
            <section aria-labelledby="meo-vat-hay">
              <SectionHeading id="meo-vat-hay" title="Mẹo vặt hay" href={`/${POST_TYPES.MEO_VAT.slug}`} />
              <ul className="divide-y md:grid md:grid-cols-2 md:gap-x-gutter-desktop md:divide-y-0">
                {meoVat.map((p) => (
                  <li key={p.slug} className="md:border-b">
                    <PostCard post={p} variant="row" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
