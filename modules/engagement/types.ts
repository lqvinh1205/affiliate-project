import type { listPostsByStatForCms } from "@/modules/engagement/cms-queries";

// Một dòng danh sách Bài web CMS kèm Lượt xem, Lượt tim (suy từ query — [QU-09]).
export type CmsPostWithStats = Awaited<ReturnType<typeof listPostsByStatForCms>>["items"][number];
