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

// Đọc Lượt xem, Lượt tim cho CMS (FR-38). Query chạm `Post` + `PostStat` nằm ở `engagement` (tầng cao nhất — AD-2);
// bộ lọc, cột và thứ tự dòng lấy từ `posts/cms-queries` để mọi cách sắp xếp ra cùng một danh sách.

// Cột số đếm dùng để sắp xếp danh sách Bài web CMS.
export type PostStatSort = "views" | "likes";

// Lượt xem, Lượt tim tổng của các bài `postIds` (bài chưa có `PostStat` = 0).
export async function getPostStatsForCms(postIds: string[]) {
  const rows = await db.postStat.findMany({
    where: { postId: { in: postIds } },
    select: { postId: true, views: true, likes: true },
  });
  const stats = new Map(rows.map(({ postId, ...s }) => [postId, s]));
  return Object.fromEntries(postIds.map((id) => [id, stats.get(id) ?? { views: 0, likes: 0 }])) as Record<
    string,
    { views: number; likes: number }
  >;
}

// Danh sách Bài web CMS xếp theo Lượt xem (`?sap-xep=luot-xem`) hoặc Lượt tim (`?sap-xep=luot-tim`) giảm dần, cùng
// bộ lọc và phân trang với `listPostsForCms`. Bài chưa có số đó (không có `PostStat` hoặc 0) xếp sau, theo thứ tự mặc
// định (sửa gần nhất) — Prisma không cho chọn vị trí NULL khi sắp theo quan hệ tuỳ chọn, nên ghép hai đoạn: có số rồi
// chưa có. Cùng số thì sửa gần nhất trước.
export async function listPostsByStatForCms({
  page,
  by,
  ...filter
}: CmsPostListFilter & { page: number; by: PostStatSort }) {
  const where = cmsPostListWhere(filter);
  const hasStat = { stat: { is: { [by]: { gt: 0 } } } } satisfies Prisma.PostWhereInput;
  const select = { ...cmsPostListSelect, stat: { select: { views: true, likes: true } } } satisfies Prisma.PostSelect;
  return db.$transaction(async (tx) => {
    const total = await tx.post.count({ where });
    const statTotal = await tx.post.count({ where: { AND: [where, hasStat] } });
    const current = clampCmsPostPage(page, total);
    const skip = (current - 1) * CMS_POST_PAGE_SIZE;
    const withStat =
      skip < statTotal
        ? await tx.post.findMany({
            where: { AND: [where, hasStat] },
            orderBy: [{ stat: { [by]: "desc" } }, ...cmsPostListOrder],
            skip,
            take: CMS_POST_PAGE_SIZE,
            select,
          })
        : [];
    const rest = CMS_POST_PAGE_SIZE - withStat.length;
    const withoutStat =
      rest > 0
        ? await tx.post.findMany({
            where: { AND: [where, { NOT: hasStat }] },
            orderBy: [...cmsPostListOrder],
            skip: Math.max(0, skip - statTotal),
            take: rest,
            select,
          })
        : [];
    const items = [...withStat, ...withoutStat].map(({ stat, ...item }) => ({
      ...item,
      views: stat?.views ?? 0,
      likes: stat?.likes ?? 0,
    }));
    return { items, total, page: current };
  });
}
