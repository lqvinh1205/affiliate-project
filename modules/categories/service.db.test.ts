import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { cacheTagsOf, resetTestDb } from "@/vitest.db.helpers";
import { UserError } from "@/platform/errors";
import { categoryInputSchema } from "@/modules/categories/schema";
import { deleteCategoryRecord, moveCategoryRecord, saveCategoryRecord } from "@/modules/categories/service";
import { getCategorySlugRedirect, getPublicCategory } from "@/modules/categories/queries";

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

describe("lịch sử đổi đường dẫn (CategorySlugRedirect)", () => {
  async function rename(id: string, slug: string) {
    return saveCategoryRecord(categoryInputSchema.parse({ id, name: "Bếp", slug, description: "" }));
  }

  it("đổi đường dẫn ghi đường dẫn cũ trỏ về Danh mục; đổi tiếp vẫn trỏ về đường dẫn mới nhất", async () => {
    const c = await create("Nhà bếp");
    await rename(c.id, "bep");
    expect(await getCategorySlugRedirect("nha-bep")).toBe("bep");
    await rename(c.id, "bep-xinh");
    expect(await getCategorySlugRedirect("nha-bep")).toBe("bep-xinh");
    expect(await getCategorySlugRedirect("bep")).toBe("bep-xinh");
    expect(await getCategorySlugRedirect("khong-co")).toBeNull();
  });

  it("sửa mà giữ đường dẫn thì không ghi lịch sử", async () => {
    const c = await create("Nhà bếp");
    await saveCategoryRecord(categoryInputSchema.parse({ id: c.id, name: "Nhà bếp mới", slug: "nha-bep", description: "" }));
    expect(await db.categorySlugRedirect.count()).toBe(0);
  });

  it("đổi về đường dẫn cũ hoặc Danh mục khác dùng lại đường dẫn cũ thì bỏ bản ghi trùng", async () => {
    const c = await create("Nhà bếp");
    await rename(c.id, "bep");
    await rename(c.id, "nha-bep");
    expect(await getCategorySlugRedirect("nha-bep")).toBeNull();
    expect(await getCategorySlugRedirect("bep")).toBe("nha-bep");

    await create("Bếp khác", "bep");
    expect(await getCategorySlugRedirect("bep")).toBeNull();
    expect(await getPublicCategory("bep")).toMatchObject({ name: "Bếp khác" });
  });

  it("đổi sang đường dẫn đang dùng báo UserError và không ghi lịch sử", async () => {
    const c = await create("Nhà bếp");
    await create("Bếp", "bep");
    await expect(rename(c.id, "bep")).rejects.toThrow(new UserError("Đường dẫn đã được dùng"));
    expect(await db.categorySlugRedirect.count()).toBe(0);
  });

  it("xoá Danh mục xoá lịch sử của nó", async () => {
    const c = await create("Nhà bếp");
    await rename(c.id, "bep");
    await deleteCategoryRecord({ id: c.id });
    expect(await getCategorySlugRedirect("nha-bep")).toBeNull();
  });
});

describe("tag cache của query public Danh mục (AD-7)", () => {
  it("getPublicCategory và getCategorySlugRedirect gắn `categories`", async () => {
    expect(await cacheTagsOf(() => getPublicCategory("a"))).toEqual(["categories"]);
    expect(await cacheTagsOf(() => getCategorySlugRedirect("a"))).toEqual(["categories"]);
  });
});
