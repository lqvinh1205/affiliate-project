import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import {
  listContentSetsForInspirationForCms,
  listInspirationsForCms,
} from "@/modules/content-sets/cms-queries";
import { INSPIRATION_PAGE_SIZE } from "@/modules/inspirations/constants";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

async function inspiration(data: { note?: string; status?: "NEW" | "SKIPPED"; createdAt?: Date } = {}) {
  return db.inspiration.create({ data: { url: "https://vt.tiktok.com/x/", ...data } });
}

async function contentSetFor(inspirationId: string) {
  const p = await db.product.create({ data: { name: "Bảng gấp áo", affiliateUrl: "https://s.shopee.vn/a" } });
  return db.contentSet.create({
    data: { inspirationId, angleName: "Gấp nhanh", products: { create: [{ productId: p.id, sortOrder: 0 }] } },
  });
}

describe("listInspirationsForCms (FR-1, UX-DR76)", () => {
  it("lọc Mới / Đã dùng / Bỏ qua; Đã dùng suy ra từ Bộ nội dung và thắng trạng thái lưu", async () => {
    const fresh = await inspiration({ note: "mới" });
    const skipped = await inspiration({ note: "bỏ", status: "SKIPPED" });
    const usedNew = await inspiration({ note: "dùng" });
    const usedSkipped = await inspiration({ note: "dùng sau khi bỏ", status: "SKIPPED" });
    await contentSetFor(usedNew.id);
    await contentSetFor(usedSkipped.id);

    const news = await listInspirationsForCms({ filter: "NEW", page: 1 });
    expect(news.items.map((i) => i.id)).toEqual([fresh.id]);
    expect(news.counts).toEqual({ NEW: 1, USED: 2, SKIPPED: 1 });
    expect(news.items[0]).toMatchObject({ label: "mới", status: "NEW", hasNote: true });

    const used = await listInspirationsForCms({ filter: "USED", page: 1 });
    expect(used.items.map((i) => i.id).sort()).toEqual([usedNew.id, usedSkipped.id].sort());
    expect(used.items.every((i) => i.status === "USED")).toBe(true);

    const skip = await listInspirationsForCms({ filter: "SKIPPED", page: 1 });
    expect(skip.items.map((i) => [i.id, i.status])).toEqual([[skipped.id, "SKIPPED"]]);
  });

  it("mới nhất trước, phân trang và kẹp trang vượt cuối", async () => {
    const base = Date.UTC(2026, 10, 1);
    for (let n = 0; n <= INSPIRATION_PAGE_SIZE; n++) {
      await inspiration({ note: `cảm hứng ${n}`, createdAt: new Date(base + n * 1000) });
    }
    const p1 = await listInspirationsForCms({ filter: "NEW", page: 1 });
    expect(p1.total).toBe(INSPIRATION_PAGE_SIZE + 1);
    expect(p1.items).toHaveLength(INSPIRATION_PAGE_SIZE);
    expect(p1.items[0].label).toBe(`cảm hứng ${INSPIRATION_PAGE_SIZE}`);
    const p9 = await listInspirationsForCms({ filter: "NEW", page: 9 });
    expect(p9.page).toBe(2);
    expect(p9.items.map((i) => i.label)).toEqual(["cảm hứng 0"]);
  });
});

describe("listContentSetsForInspirationForCms (FR-2, UX-DR77)", () => {
  it("Bộ nội dung tạo từ Cảm hứng, kèm tên Sản phẩm đầu tiên", async () => {
    const i = await inspiration();
    const other = await inspiration();
    const set = await contentSetFor(i.id);
    await contentSetFor(other.id);
    expect(await listContentSetsForInspirationForCms(i.id)).toEqual([
      { id: set.id, title: "Gấp nhanh", productName: "Bảng gấp áo", createdAt: set.createdAt.toISOString() },
    ]);
  });

  it("xoá Cảm hứng: Bộ nội dung giữ lại, chỉ mất liên kết", async () => {
    const i = await inspiration();
    const set = await contentSetFor(i.id);
    await db.inspiration.delete({ where: { id: i.id } });
    expect((await db.contentSet.findUniqueOrThrow({ where: { id: set.id } })).inspirationId).toBeNull();
  });
});
