import "server-only";
import type { z } from "zod";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import { Prisma } from "@/generated/prisma/client";
import type {
  CategoryInput,
  deleteCategoryInputSchema,
  moveCategoryInputSchema,
} from "@/modules/categories/schema";

const NOT_FOUND = "Không tìm thấy Danh mục. Có thể đã bị xoá.";
const SLUG_TAKEN = "Đường dẫn đã được dùng";
// Server không đếm bảng của module khác (AD-2); số cụ thể do màn danh sách báo trước khi gọi xoá.
const STILL_USED = "Danh mục vẫn còn Bài web hoặc Sản phẩm. Chuyển sang Danh mục khác trước.";

function prismaCode(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError ? e.code : null;
}

function inTransaction<T>(tx: Prisma.TransactionClient | undefined, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return tx ? fn(tx) : db.$transaction(fn);
}

// Tạo mới thì đứng cuối danh sách; sửa thì giữ thứ tự. Đổi đường dẫn thì ghi đường dẫn cũ vào
// `CategorySlugRedirect` để `/<cũ>` trả 308 sang đường dẫn mới (AD-20). Đường dẫn vừa được dùng lại
// thì bỏ bản ghi lịch sử trùng nó, để không có đường dẫn vừa là Danh mục vừa là chuyển hướng.
export async function saveCategoryRecord(data: CategoryInput, tx?: Prisma.TransactionClient) {
  const { id, ...fields } = data;
  try {
    return await inTransaction(tx, async (c) => {
      await c.categorySlugRedirect.deleteMany({ where: { oldSlug: fields.slug } });
      if (id) {
        const current = await c.category.findUnique({ where: { id }, select: { slug: true } });
        if (!current) throw new UserError(NOT_FOUND);
        if (current.slug !== fields.slug) {
          await c.categorySlugRedirect.create({ data: { oldSlug: current.slug, categoryId: id } });
        }
        return c.category.update({ where: { id }, data: fields, select: { id: true, slug: true } });
      }
      const last = await c.category.aggregate({ _max: { sortOrder: true } });
      return c.category.create({
        data: { ...fields, sortOrder: (last._max.sortOrder ?? -1) + 1 },
        select: { id: true, slug: true },
      });
    });
  } catch (e) {
    if (prismaCode(e) === "P2002") throw new UserError(SLUG_TAKEN);
    if (prismaCode(e) === "P2025") throw new UserError(NOT_FOUND);
    throw e;
  }
}

// FK `Restrict` từ Post/Product chặn xoá khi còn tham chiếu, kể cả khi bài vừa gắn sau lúc tải trang.
export async function deleteCategoryRecord(
  data: z.infer<typeof deleteCategoryInputSchema>,
  tx?: Prisma.TransactionClient,
) {
  try {
    await (tx ?? db).category.delete({ where: { id: data.id } });
  } catch (e) {
    if (prismaCode(e) === "P2003") throw new UserError(STILL_USED);
    if (prismaCode(e) === "P2025") return; // đã bị xoá: coi như xong
    throw e;
  }
}

// Đổi chỗ với mục kề rồi đánh số lại 0..n-1, để thứ tự trùng nhau (dữ liệu cũ) vẫn đổi được.
export async function moveCategoryRecord(
  data: z.infer<typeof moveCategoryInputSchema>,
  tx?: Prisma.TransactionClient,
) {
  await inTransaction(tx, async (c) => {
    const list = await c.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: { id: true, sortOrder: true },
    });
    const from = list.findIndex((x) => x.id === data.id);
    if (from === -1) throw new UserError(NOT_FOUND);
    const to = data.direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= list.length) return;
    [list[from], list[to]] = [list[to], list[from]];
    for (const [i, x] of list.entries()) {
      if (x.sortOrder !== i) await c.category.update({ where: { id: x.id }, data: { sortOrder: i } });
    }
  });
}
