import type { getLatestPosts, getPostBySlug, listNavCategories, listPostsByType } from "@/modules/posts/queries";

// Kiểu suy từ query, không chép tay ([NO-18], [QU-09]).
// Thẻ Bài web public (PostCard).
export type PostCardData = Awaited<ReturnType<typeof getLatestPosts>>[number];
// Bài web public đầy đủ (màn Bài web).
export type PublicPost = NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;
// Một trang danh sách Bài web (trang Danh mục / Loại bài).
export type PostListPage = Awaited<ReturnType<typeof listPostsByType>>;
export type NavCategory = Awaited<ReturnType<typeof listNavCategories>>[number];
