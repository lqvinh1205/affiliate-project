import "server-only";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import { Prisma } from "@/generated/prisma/client";
import type { ProductInput } from "@/modules/products/schema";

const NOT_FOUND = "Không tìm thấy Sản phẩm. Có thể đã bị xoá.";
const CATEGORY_GONE = "Danh mục đã chọn không còn tồn tại. Tải lại trang rồi chọn lại.";

function prismaCode(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError ? e.code : null;
}

function inTransaction<T>(tx: Prisma.TransactionClient | undefined, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return tx ? fn(tx) : db.$transaction(fn);
}

// Tạo/sửa Sản phẩm trong Kho. `priceUpdatedAt` chỉ đổi khi `priceText` khác giá đang lưu;
// xoá giá thì cả hai về null.
export async function saveProductRecord(data: ProductInput, tx?: Prisma.TransactionClient) {
  const { id, ...fields } = data;
  const select = { id: true } as const;
  try {
    return await inTransaction(tx, async (c) => {
      if (!id) {
        return c.product.create({
          data: { ...fields, priceUpdatedAt: fields.priceText ? new Date() : null },
          select,
        });
      }
      const current = await c.product.findUnique({ where: { id }, select: { priceText: true } });
      if (!current) throw new UserError(NOT_FOUND);
      const priceChanged = fields.priceText !== current.priceText;
      return c.product.update({
        where: { id },
        data: {
          ...fields,
          ...(priceChanged && { priceUpdatedAt: fields.priceText ? new Date() : null }),
        },
        select,
      });
    });
  } catch (e) {
    if (prismaCode(e) === "P2003") throw new UserError(CATEGORY_GONE);
    if (prismaCode(e) === "P2025") throw new UserError(NOT_FOUND);
    throw e;
  }
}
