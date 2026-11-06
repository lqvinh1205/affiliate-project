import "server-only";
import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import { bannerOrderBy } from "@/modules/banners/queries";
import type { BannerInput, deleteBannerInputSchema, moveBannerInputSchema } from "@/modules/banners/schema";

const NOT_FOUND = "Không tìm thấy Banner. Có thể đã bị xoá.";

function prismaCode(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError ? e.code : null;
}

function inTransaction<T>(tx: Prisma.TransactionClient | undefined, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return tx ? fn(tx) : db.$transaction(fn);
}

// Tạo mới thì đứng cuối danh sách; sửa thì giữ thứ tự.
export async function saveBannerRecord(data: BannerInput, tx?: Prisma.TransactionClient) {
  const { id, ...fields } = data;
  try {
    return await inTransaction(tx, async (c) => {
      if (id) return c.banner.update({ where: { id }, data: fields, select: { id: true } });
      const last = await c.banner.aggregate({ _max: { sortOrder: true } });
      return c.banner.create({ data: { ...fields, sortOrder: (last._max.sortOrder ?? -1) + 1 }, select: { id: true } });
    });
  } catch (e) {
    if (prismaCode(e) === "P2025") throw new UserError(NOT_FOUND);
    throw e;
  }
}

// Banner không được bảng nào tham chiếu: xoá cứng. Đã bị xoá thì coi như xong.
export async function deleteBannerRecord(
  data: z.infer<typeof deleteBannerInputSchema>,
  tx?: Prisma.TransactionClient,
) {
  await (tx ?? db).banner.deleteMany({ where: { id: data.id } });
}

// Đổi chỗ với Banner kề rồi đánh số lại 0..n-1, để thứ tự trùng nhau vẫn đổi được.
export async function moveBannerRecord(
  data: z.infer<typeof moveBannerInputSchema>,
  tx?: Prisma.TransactionClient,
) {
  await inTransaction(tx, async (c) => {
    const list = await c.banner.findMany({ orderBy: bannerOrderBy, select: { id: true, sortOrder: true } });
    const from = list.findIndex((x) => x.id === data.id);
    if (from === -1) throw new UserError(NOT_FOUND);
    const to = data.direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= list.length) return;
    [list[from], list[to]] = [list[to], list[from]];
    for (const [i, x] of list.entries()) {
      if (x.sortOrder !== i) await c.banner.update({ where: { id: x.id }, data: { sortOrder: i } });
    }
  });
}
