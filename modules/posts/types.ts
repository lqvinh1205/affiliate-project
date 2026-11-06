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

// Cảnh báo rủi ro của nội dung AI (FR-23): câu trích nguyên văn + lý do. Màn soạn Bài web nhận qua props (AD-19:
// `posts` không import `suggestions`; Screen lấy từ `suggestions/cms-queries` rồi truyền xuống).
export type RiskWarning = { sentence: string; reason: string };

// Khoá nút Xuất bản khi Bài web còn gợi ý AI Đang tạo / Chờ duyệt (FR-22, UX-DR72) — chỉ ở giao diện.
export type PublishLock = { reason: string; href: string };

export type { WebPostPayload } from "@/modules/posts/prompts/web-post.prompt";
