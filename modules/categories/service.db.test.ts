import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { UserError } from "@/platform/errors";
import { categoryInputSchema } from "@/modules/categories/schema";
import { deleteCategoryRecord, moveCategoryRecord, saveCategoryRecord } from "@/modules/categories/service";

async function create(name: string, slug = "") {
  return saveCategoryRecord(categoryInputSchema.parse({ name, slug, description: "" }));
}

async function order() {
  const rows = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true } });
  return rows.map((r) => r.name);
}

async function useCategory(categoryId: string, posts: number, products: number) {
  for (let i = 0; i < posts; i++) {
    await db.post.create({
      data: { title: `Bài ${i}`, slug: `bai-${categoryId}-${i}`, content: "<p>x</p>", postType: "MEO_VAT", categoryId },
    });
  }
  for (let i = 0; i < products; i++) {
    await db.product.create({ data: { name: `SP ${i}`, affiliateUrl: "https://shopee.vn/x", categoryId } });
  }
}

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

describe("saveCategoryRecord", () => {
  it("tạo Danh mục với đường dẫn từ tên, đứng cuối danh sách", async () => {
    await create("Nhà bếp");
    const saved = await create("Đồ bếp");
    expect(saved.slug).toBe("do-bep");
    const row = await db.category.findUniqueOrThrow({ where: { id: saved.id } });
    expect(row).toMatchObject({ name: "Đồ bếp", slug: "do-bep", description: null, sortOrder: 1 });
    expect(await order()).toEqual(["Nhà bếp", "Đồ bếp"]);
  });

  it("sửa giữ nguyên thứ tự", async () => {
    await create("A");
    const b = await create("B");
    await saveCategoryRecord(categoryInputSchema.parse({ id: b.id, name: "B mới", slug: "b-moi", description: "Mô tả" }));
    const row = await db.category.findUniqueOrThrow({ where: { id: b.id } });
    expect(row).toMatchObject({ name: "B mới", slug: "b-moi", description: "Mô tả", sortOrder: 1 });
  });

  it("đường dẫn trùng Danh mục khác báo UserError", async () => {
    await create("Đồ bếp");
    await expect(create("Khác", "do-bep")).rejects.toThrow(new UserError("Đường dẫn đã được dùng"));
  });

  it("sửa Danh mục đã bị xoá báo UserError", async () => {
    const a = await create("A");
    await db.category.delete({ where: { id: a.id } });
    await expect(
      saveCategoryRecord(categoryInputSchema.parse({ id: a.id, name: "A", slug: "", description: "" })),
    ).rejects.toBeInstanceOf(UserError);
  });
});

describe("deleteCategoryRecord", () => {
  it("xoá Danh mục trống", async () => {
    const a = await create("A");
    await deleteCategoryRecord({ id: a.id });
    expect(await db.category.count()).toBe(0);
  });

  it("Danh mục còn Bài web và Sản phẩm thì server từ chối bằng UserError, không xoá", async () => {
    const a = await create("A");
    await useCategory(a.id, 3, 2);
    await expect(deleteCategoryRecord({ id: a.id })).rejects.toThrow(
      new UserError("Danh mục vẫn còn Bài web hoặc Sản phẩm. Chuyển sang Danh mục khác trước."),
    );
    expect(await db.category.count()).toBe(1);
  });

  it("chỉ còn Sản phẩm cũng bị chặn (bài gắn sau lúc tải trang vẫn bị chặn ở server)", async () => {
    const a = await create("A");
    await useCategory(a.id, 0, 1);
    await expect(deleteCategoryRecord({ id: a.id })).rejects.toBeInstanceOf(UserError);
  });

  it("xoá Danh mục đã bị xoá không báo lỗi", async () => {
    const a = await create("A");
    await deleteCategoryRecord({ id: a.id });
    await expect(deleteCategoryRecord({ id: a.id })).resolves.toBeUndefined();
  });
});

describe("moveCategoryRecord", () => {
  it("mục giữa lên/xuống đổi chỗ với mục kề", async () => {
    await create("A");
    const b = await create("B");
    await create("C");
    await moveCategoryRecord({ id: b.id, direction: "up" });
    expect(await order()).toEqual(["B", "A", "C"]);
    await moveCategoryRecord({ id: b.id, direction: "down" });
    await moveCategoryRecord({ id: b.id, direction: "down" });
    expect(await order()).toEqual(["A", "C", "B"]);
  });

  it("mục đầu lên và mục cuối xuống không đổi gì", async () => {
    const a = await create("A");
    const b = await create("B");
    await moveCategoryRecord({ id: a.id, direction: "up" });
    await moveCategoryRecord({ id: b.id, direction: "down" });
    expect(await order()).toEqual(["A", "B"]);
  });

  it("thứ tự trùng nhau vẫn đổi chỗ được và được đánh số lại", async () => {
    const a = await create("A");
    const b = await create("B");
    await db.category.updateMany({ data: { sortOrder: 0 } });
    await moveCategoryRecord({ id: b.id, direction: "up" });
    const rows = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, sortOrder: true } });
    expect(rows).toEqual([
      { id: b.id, sortOrder: 0 },
      { id: a.id, sortOrder: 1 },
    ]);
  });

  it("Danh mục không tồn tại báo UserError", async () => {
    await expect(moveCategoryRecord({ id: "khong-co", direction: "up" })).rejects.toBeInstanceOf(UserError);
  });
});
