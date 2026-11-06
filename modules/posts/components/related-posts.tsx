import { RELATED_POSTS_TITLE_ID } from "@/modules/posts/constants";
import type { PostCardData } from "@/modules/posts/types";
import { PostCard } from "@/modules/posts/components/post-card";

// RelatedPosts (UX-DR17): tối đa 3 bài cùng Danh mục (query lo); mobile PostCard *row*, desktop *grid* 3 cột;
// 0 bài thì ẩn khu.
export function RelatedPosts({ posts }: { posts: PostCardData[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby={RELATED_POSTS_TITLE_ID} className="space-y-space-md">
      <h2 id={RELATED_POSTS_TITLE_ID} className="text-headline-md lg:text-headline-lg">
        Bài liên quan
      </h2>
      <ul className="divide-y lg:hidden">
        {posts.map((p) => (
          <li key={p.slug}>
            <PostCard post={p} variant="row" />
          </li>
        ))}
      </ul>
      <ul className="hidden gap-gutter-desktop lg:grid lg:grid-cols-3">
        {posts.map((p) => (
          <li key={p.slug}>
            <PostCard post={p} variant="grid" headingLevel="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
