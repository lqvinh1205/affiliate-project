import type { getContentSetForCms, listContentSetsForProductForCms } from "@/modules/content-sets/cms-queries";

export type { FacebookPayload, LinkCommentPayload, ThreadsPayload } from "@/modules/content-sets/schema";

// Bộ nội dung như màn CMS đọc (ngày là chuỗi ISO).
export type ContentSetForCms = NonNullable<Awaited<ReturnType<typeof getContentSetForCms>>>;
export type SocialPostForCms = ContentSetForCms["socialPosts"][number];
export type ContentSetProductForCms = ContentSetForCms["products"][number];
export type ProductContentSetItem = Awaited<ReturnType<typeof listContentSetsForProductForCms>>[number];
