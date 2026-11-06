import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import type { InspirationInput } from "@/modules/inspirations/schema";

const NOT_FOUND = "Không tìm thấy Cảm hứng. Có thể đã bị xoá.";

function notFound(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") throw new UserError(NOT_FOUND);
  throw e;
}

// Lưu Cảm hứng (FR-1): tạo mới ở *Mới*, hoặc sửa link / file / ghi chú (giữ trạng thái).
export async function saveInspirationRecord(data: InspirationInput) {
  const fields = { url: data.url, mediaUrl: data.mediaUrl, note: data.note };
  if (!data.id) return db.inspiration.create({ data: fields, select: { id: true } });
  return db.inspiration.update({ where: { id: data.id }, data: fields, select: { id: true } }).catch(notFound);
}

// "Bỏ qua" / "Đưa lại vào Mới" (UX-DR61).
export async function setInspirationStatusRecord(data: { id: string; status: "NEW" | "SKIPPED" }) {
  return db.inspiration
    .update({ where: { id: data.id }, data: { status: data.status }, select: { id: true } })
    .catch(notFound);
}
