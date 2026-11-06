import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { CMS_POST_PAGE_SIZE } from "@/modules/posts/constants";
import {
  clampCmsPostPage,
  cmsPostListOrder,
  cmsPostListSelect,
  cmsPostListWhere,
  type CmsPostListFilter,
} from "@/modules/posts/cms-queries";

// Đọc Lượt xem cho CMS (FR-38). Query chạm `Post` + `PostStat` nằm ở `engagement` (tầng cao nhất — AD-2); bộ lọc,
// cột và thứ tự dòng lấy từ `posts/cms-queries` để hai cách sắp xếp ra cùng một danh sách.

// Lượt xem tổng của các bài `postIds` (bài chưa có `PostStat` = 0).
export async function getPostViewsForCms(postIds: string[]) {
  const rows = await db.postStat.findMany({ where: { postId: { in: postIds } }, select: { postId: true, views: true } });
  const views = new Map(rows.map((r) => [r.postId, r.views]));
  return Object.fromEntries(postIds.map((id) => [id, views.get(id) ?? 0])) as Record<string, number>;
}

// Danh sách Bài web CMS xếp theo Lượt xem giảm dần (`?sap-xep=luot-xem`), cùng bộ lọc và phân trang với
// `listPostsForCms`. Bài chưa có lượt xem (không có `PostStat` hoặc 0) xếp sau, theo thứ tự mặc định (sửa gần nhất)
// — Prisma không cho chọn vị trí NULL khi sắp theo quan hệ tuỳ chọn, nên ghép hai đoạn: có lượt xem rồi chưa có.
export async function listPostsByViewsForCms({ page, ...filter }: CmsPostListFilter & { page: number }) {
  const where = cmsPostListWhere(filter);
  const hasViews = { stat: { is: { views: { gt: 0 } } } } satisfies Prisma.PostWhereInput;
  const select = { ...cmsPostListSelect, stat: { select: { views: true } } } satisfies Prisma.PostSelect;
  return db.$transaction(async (tx) => {
    const total = await tx.post.count({ where });
    const viewedTotal = await tx.post.count({ where: { AND: [where, hasViews] } });
    const current = clampCmsPostPage(page, total);
    const skip = (current - 1) * CMS_POST_PAGE_SIZE;
    const viewed =
      skip < viewedTotal
        ? await tx.post.findMany({
            where: { AND: [where, hasViews] },
            orderBy: [{ stat: { views: "desc" } }, ...cmsPostListOrder],
            skip,
            take: CMS_POST_PAGE_SIZE,
            select,
          })
        : [];
    const rest = CMS_POST_PAGE_SIZE - viewed.length;
    const unviewed =
      rest > 0
        ? await tx.post.findMany({
            where: { AND: [where, { NOT: hasViews }] },
            orderBy: [...cmsPostListOrder],
            skip: Math.max(0, skip - viewedTotal),
            take: rest,
            select,
          })
        : [];
    const items = [...viewed, ...unviewed].map(({ stat, ...item }) => ({ ...item, views: stat?.views ?? 0 }));
    return { items, total, page: current };
  });
}
