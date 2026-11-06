import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { vietnamDay } from "@/platform/format";
import { publishedPostWhere } from "@/modules/posts/queries";

type Tx = Prisma.TransactionClient;

// Ghi một Lượt xem (FR-33, AD-23): tăng `PostStat.views` (tạo lười) và `PostViewDaily` của ngày Việt Nam hiện tại.
// Chỉ Bài web đã xuất bản; không có → `false`, không ghi gì. Không chạm bảng `Post` (giữ `updatedAt`).
export async function recordPostViewRecord(postId: string, now = new Date(), tx?: Tx) {
  const write = async (c: Tx) => {
    const post = await c.post.findFirst({ where: { ...publishedPostWhere, id: postId }, select: { id: true } });
    if (!post) return false;
    await c.postStat.upsert({
      where: { postId },
      create: { postId, views: 1 },
      update: { views: { increment: 1 } },
    });
    const day = vietnamDay(now);
    await c.postViewDaily.upsert({
      where: { postId_day: { postId, day } },
      create: { postId, day, views: 1 },
      update: { views: { increment: 1 } },
    });
    return true;
  };
  return tx ? write(tx) : db.$transaction(write);
}
