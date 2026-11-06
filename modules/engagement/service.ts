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

// Số Lượt tim của Bài web đã xuất bản (FR-35); bài không có / chưa xuất bản / chưa có `PostStat` → 0. Đọc không cache
// cho action công khai chỉ đọc (AD-5).
export async function getPostLikesRecord(postId: string) {
  const stat = await db.postStat.findFirst({ where: { postId, post: publishedPostWhere }, select: { likes: true } });
  return stat?.likes ?? 0;
}

// Thả tim (+1, tạo lười `PostStat`) hoặc bỏ tim (−1, không xuống dưới 0) Bài web đã xuất bản (FR-35, AD-23); trả số
// Lượt tim mới. Bài không có / chưa xuất bản → `null`, không ghi gì. Không chạm bảng `Post` (giữ `updatedAt`).
export async function setPostLikeRecord(postId: string, liked: boolean, tx?: Tx) {
  const write = async (c: Tx) => {
    const post = await c.post.findFirst({ where: { ...publishedPostWhere, id: postId }, select: { id: true } });
    if (!post) return null;
    if (liked) {
      const stat = await c.postStat.upsert({
        where: { postId },
        create: { postId, likes: 1 },
        update: { likes: { increment: 1 } },
        select: { likes: true },
      });
      return stat.likes;
    }
    await c.postStat.updateMany({ where: { postId, likes: { gt: 0 } }, data: { likes: { decrement: 1 } } });
    const stat = await c.postStat.findUnique({ where: { postId }, select: { likes: true } });
    return stat?.likes ?? 0;
  };
  return tx ? write(tx) : db.$transaction(write);
}
