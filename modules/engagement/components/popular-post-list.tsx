import type { PostCardData } from "@/modules/posts/types";
import { PostCard } from "@/modules/posts/components/post-card";

// Danh sách "Xem nhiều" (FR-34, UX-DR16, UX-DR90): PostCard *rank* `01`–`05` trong `<ol>` (số chỉ trang trí, thứ tự
// do `<ol>` đọc). Nơi dùng đặt tiêu đề khu và ẩn khu khi rỗng.
export function PopularPostList({ posts, headingLevel = "h3" }: { posts: PostCardData[]; headingLevel?: "h2" | "h3" }) {
  return (
    <ol className="divide-y">
      {posts.map((p, i) => (
        <li key={p.slug}>
          <PostCard post={p} variant="rank" rank={i + 1} headingLevel={headingLevel} />
        </li>
      ))}
    </ol>
  );
}
