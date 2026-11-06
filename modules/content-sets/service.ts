import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import { PLATFORM_LABEL, type SocialPlatform } from "@/modules/content-sets/constants";

// Ghi bảng `ContentSet`, `ContentSetProduct`, `SocialPost` (chủ: `content-sets`). Hàm nhận `tx` được
// `modules/suggestions/actions.ts` gọi trong transaction tạo bộ / Duyệt (AD-9).

type Tx = Prisma.TransactionClient;

const SET_NOT_FOUND = "Không tìm thấy Bộ nội dung. Có thể đã bị xoá.";
const SOCIAL_NOT_FOUND = "Không tìm thấy bài mạng xã hội. Tải lại trang.";

export type ContentSetChoice = { id: string; name: string; text: string; edit: string | null };

// Tạo Bộ nội dung (FR-12, FR-16) cùng Sản phẩm theo thứ tự (Sản phẩm đầu tiên dùng cho SM-3).
export async function createContentSetRecord(
  data: {
    productIds: string[];
    postId?: string | null;
    angle?: ContentSetChoice | null;
    audience?: ContentSetChoice | null;
  },
  tx?: Tx,
) {
  const { angle, audience } = data;
  return (tx ?? db).contentSet.create({
    data: {
      postId: data.postId ?? null,
      angleId: angle?.id ?? null,
      angleName: angle?.name ?? null,
      angleHook: angle?.text ?? null,
      angleEdit: angle?.edit ?? null,
      audienceId: audience?.id ?? null,
      audienceName: audience?.name ?? null,
      audienceReason: audience?.text ?? null,
      audienceEdit: audience?.edit ?? null,
      products: { create: data.productIds.map((productId, sortOrder) => ({ productId, sortOrder })) },
    },
    select: { id: true },
  });
}

// Bài web đích của bộ (AD-19): ghi sau khi Duyệt `WEB_POST` tạo `Post` nháp.
export async function setContentSetPostRecord(data: { contentSetId: string; postId: string }, tx?: Tx) {
  const { count } = await (tx ?? db).contentSet.updateMany({ where: { id: data.contentSetId }, data: { postId: data.postId } });
  if (count !== 1) throw new UserError(SET_NOT_FOUND);
}

// Duyệt `THREADS_POST` / `FACEBOOK_POST` (AD-19): upsert theo `contentSetId` + `platform`, nên Duyệt lại (sau Tạo
// lại) thay nội dung bài, giữ mốc đã đăng và Bình luận. `firstCopiedAt` của gợi ý chép sang nếu đích chưa có (AD-21).
export async function upsertSocialPostRecord(
  data: {
    contentSetId: string;
    platform: SocialPlatform;
    parts: string[];
    styleProfileId: string | null;
    firstCopiedAt: Date | null;
  },
  tx?: Tx,
) {
  const c = tx ?? db;
  const key = { contentSetId_platform: { contentSetId: data.contentSetId, platform: data.platform } };
  const current = await c.socialPost.findUnique({ where: key, select: { firstCopiedAt: true } });
  return c.socialPost.upsert({
    where: key,
    create: {
      contentSetId: data.contentSetId,
      platform: data.platform,
      parts: data.parts,
      styleProfileId: data.styleProfileId,
      firstCopiedAt: data.firstCopiedAt,
    },
    update: {
      parts: data.parts,
      styleProfileId: data.styleProfileId,
      firstCopiedAt: current?.firstCopiedAt ?? data.firstCopiedAt,
    },
    select: { id: true },
  });
}

// Duyệt `LINK_COMMENT` (AD-19): cần bài cùng nền tảng đã Duyệt (có `SocialPost`), chưa có thì `UserError`.
export async function setLinkCommentRecord(
  data: { contentSetId: string; platform: SocialPlatform; linkComment: string; firstCopiedAt: Date | null },
  tx?: Tx,
) {
  const c = tx ?? db;
  const key = { contentSetId_platform: { contentSetId: data.contentSetId, platform: data.platform } };
  const current = await c.socialPost.findUnique({ where: key, select: { firstCopiedAt: true } });
  if (!current) throw new UserError(`Duyệt bài ${PLATFORM_LABEL[data.platform]} trước`);
  return c.socialPost.update({
    where: key,
    data: { linkComment: data.linkComment, firstCopiedAt: current.firstCopiedAt ?? data.firstCopiedAt },
    select: { id: true },
  });
}

// Sửa bài đã Duyệt (FR-22), nội dung đã parse theo nền tảng ở action. Threads giữ nguyên số bài trong chuỗi
// (không thêm/xoá bài — UX-DR41).
export async function saveSocialPostRecord(data: { id: string; parts: string[] }) {
  const current = await db.socialPost.findUnique({ where: { id: data.id }, select: { platform: true, parts: true } });
  if (!current) throw new UserError(SOCIAL_NOT_FOUND);
  if (current.platform === "THREADS" && data.parts.length !== current.parts.length) {
    throw new UserError("Không thêm/xoá bài trong chuỗi. Muốn đổi số bài thì Tạo lại.");
  }
  if (current.platform === "FACEBOOK" && data.parts.length !== 1) throw new UserError("Bài Facebook chỉ có một phần.");
  return db.socialPost.update({ where: { id: data.id }, data: { parts: data.parts }, select: { id: true } });
}

// Sửa Bình luận kèm link đã Duyệt.
export async function saveLinkCommentRecord(data: { id: string; linkComment: string }) {
  const { count } = await db.socialPost.updateMany({
    where: { id: data.id, linkComment: { not: null } },
    data: { linkComment: data.linkComment },
  });
  if (count !== 1) throw new UserError("Bình luận chưa được duyệt. Tải lại trang.");
  return { id: data.id };
}

// Sao chép sau Duyệt (AD-21): chỉ ghi lần đầu.
export async function recordCopyRecord(data: { id: string }) {
  await db.socialPost.updateMany({ where: { id: data.id, firstCopiedAt: null }, data: { firstCopiedAt: new Date() } });
  return { id: data.id };
}

// Đánh dấu / bỏ đánh dấu đã đăng (FR-20, SM-2).
export async function markPostedRecord(data: { id: string; postUrl: string | null } | { id: string; unmark: true }) {
  const posted = "unmark" in data ? { postedAt: null, postUrl: null } : { postedAt: new Date(), postUrl: data.postUrl };
  try {
    await db.socialPost.update({ where: { id: data.id }, data: posted, select: { id: true } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") throw new UserError(SOCIAL_NOT_FOUND);
    throw e;
  }
  return { id: data.id };
}
