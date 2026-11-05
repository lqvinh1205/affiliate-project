import type { listPostsForCms } from "@/modules/posts/cms-queries";
import type { getLatestPosts, getPostBySlug, listNavCategories, listPostsByType } from "@/modules/posts/queries";

// Kiểu suy từ query, không chép tay ([NO-18], [QU-09]).
// Thẻ Bài web public (PostCard).
export type PostCardData = Awaited<ReturnType<typeof getLatestPosts>>[number];
// Bài web public đầy đủ (màn Bài web).
export type PublicPost = NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;
// Một trang danh sách Bài web (trang Danh mục / Loại bài).
export type PostListPage = Awaited<ReturnType<typeof listPostsByType>>;
export type NavCategory = Awaited<ReturnType<typeof listNavCategories>>[number];
// Một dòng danh sách Bài web trong CMS.
export type CmsPostListItem = Awaited<ReturnType<typeof listPostsForCms>>["items"][number];
// Dữ liệu thân trang bài (`PostArticle`): trang public truyền `PublicPost`, bản xem trước dựng từ giá trị form.
export type ArticlePost = Pick<
  PublicPost,
  "title" | "postType" | "publishedAt" | "readingMinutes" | "featuredImage" | "tags" | "category" | "products"
>;
