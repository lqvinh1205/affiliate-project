import type {
  getContentSetForCms,
  listContentSetsForInspirationForCms,
  listContentSetsForProductForCms,
  listInspirationsForCms,
} from "@/modules/content-sets/cms-queries";

export type { FacebookPayload, LinkCommentPayload, ThreadsPayload } from "@/modules/content-sets/schema";

// Bộ nội dung như màn CMS đọc (ngày là chuỗi ISO).
export type ContentSetForCms = NonNullable<Awaited<ReturnType<typeof getContentSetForCms>>>;
export type SocialPostForCms = ContentSetForCms["socialPosts"][number];
export type ContentSetProductForCms = ContentSetForCms["products"][number];
export type ProductContentSetItem = Awaited<ReturnType<typeof listContentSetsForProductForCms>>[number];
export type InspirationContentSetItem = Awaited<ReturnType<typeof listContentSetsForInspirationForCms>>[number];
// Một dòng ở danh sách `/cms/cam-hung` (trạng thái hiển thị đã gộp *Đã dùng*).
export type InspirationListItem = Awaited<ReturnType<typeof listInspirationsForCms>>["items"][number];
