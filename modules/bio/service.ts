import "server-only";
import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/platform/db";
import { UserError } from "@/platform/errors";
import { visibleProductWhere } from "@/modules/products/queries";
import { bioStateOf, orderBioEntries, planBioMove, type BioState } from "@/modules/bio/order";
import type {
  BioSettingsInput,
  moveBioItemInputSchema,
  setBioItemPinnedInputSchema,
  setBioItemVisibleInputSchema,
} from "@/modules/bio/schema";

type Tx = Prisma.TransactionClient;

const PRODUCT_UNAVAILABLE = "Sản phẩm không còn trong Kho hoặc đang ẩn. Tải lại trang.";

function inTransaction<T>(tx: Tx | undefined, fn: (tx: Tx) => Promise<T>) {
  return tx ? fn(tx) : db.$transaction(fn);
}

// Một bản ghi duy nhất: cập nhật bản đầu tiên, chưa có thì tạo (FR-31).
export async function saveBioSettingsRecord(data: BioSettingsInput, tx?: Tx) {
  return inTransaction(tx, async (c) => {
    const existing = await c.bioSettings.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
    if (existing) return c.bioSettings.update({ where: { id: existing.id }, data, select: { id: true } });
    return c.bioSettings.create({ data, select: { id: true } });
  });
}

// Chỉ Sản phẩm đang hiện trên website có trên `/cms/bio` (FR-31): Sản phẩm ẩn không chỉnh được.
async function requireVisibleProduct(c: Tx, productId: string) {
  const product = await c.product.findFirst({ where: { id: productId, ...visibleProductWhere }, select: { id: true } });
  if (!product) throw new UserError(PRODUCT_UNAVAILABLE);
}

function upsertBioItem(c: Tx, productId: string, data: Partial<BioState>) {
  return c.bioItem.upsert({ where: { productId }, create: { productId, ...data }, update: data });
}

// "Hiện trên bio" (FR-31); tạo `BioItem` lười.
export async function setBioItemVisibleRecord(data: z.infer<typeof setBioItemVisibleInputSchema>, tx?: Tx) {
  await inTransaction(tx, async (c) => {
    await requireVisibleProduct(c, data.productId);
    await upsertBioItem(c, data.productId, { visible: data.visible });
  });
}

// Ghim: món mới ghim đứng cuối nhóm "Đang ghim" (theo thứ tự đặt). Bỏ ghim: về chỗ theo ngày tạo.
export async function setBioItemPinnedRecord(data: z.infer<typeof setBioItemPinnedInputSchema>, tx?: Tx) {
  await inTransaction(tx, async (c) => {
    await requireVisibleProduct(c, data.productId);
    const current = await c.bioItem.findUnique({ where: { productId: data.productId }, select: { pinned: true } });
    if ((current?.pinned ?? false) === data.pinned) return;
    await upsertBioItem(c, data.productId, { pinned: data.pinned, sortAt: data.pinned ? new Date() : null });
  });
}

// Lên/xuống một bậc trong nhóm của món ("Đang ghim" hoặc còn lại), giữa các Sản phẩm đang hiện trên website.
export async function moveBioItemRecord(data: z.infer<typeof moveBioItemInputSchema>, tx?: Tx) {
  await inTransaction(tx, async (c) => {
    await requireVisibleProduct(c, data.productId);
    const rows = await c.product.findMany({
      where: visibleProductWhere,
      select: { id: true, createdAt: true, bioItem: { select: { visible: true, pinned: true, sortAt: true } } },
    });
    const self = rows.find((r) => r.id === data.productId);
    const kind = self && bioStateOf(self).pinned ? "pinned" : "rest";
    const plan = planBioMove(orderBioEntries(rows)[kind], kind, data.productId, data.direction);
    for (const { id, sortAt } of plan) await upsertBioItem(c, id, { sortAt });
  });
}
