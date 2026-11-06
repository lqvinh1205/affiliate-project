import type { listPostsByViewsForCms } from "@/modules/engagement/cms-queries";

// Một dòng danh sách Bài web CMS kèm Lượt xem (suy từ query — [QU-09]).
export type CmsPostWithViews = Awaited<ReturnType<typeof listPostsByViewsForCms>>["items"][number];
