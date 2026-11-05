import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { deleteCategory, moveCategory, saveCategory } from "@/modules/categories/actions";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

describe("action Danh mục làm mới tag `categories`", () => {
  it("saveCategory", async () => {
    const res = await saveCategory({ name: "Nhà bếp", slug: "", description: "" });
    expect(res).toMatchObject({ ok: true, slug: "nha-bep" });
    expect(actionTest.updatedTags).toEqual(["categories"]);
  });

  it("moveCategory", async () => {
    await db.category.create({ data: { name: "A", slug: "a", sortOrder: 0 } });
    const b = await db.category.create({ data: { name: "B", slug: "b", sortOrder: 1 } });
    expect(await moveCategory({ id: b.id, direction: "up" })).toEqual({ ok: true });
    expect(actionTest.updatedTags).toEqual(["categories"]);
  });

  it("deleteCategory", async () => {
    const a = await db.category.create({ data: { name: "A", slug: "a" } });
    expect(await deleteCategory({ id: a.id })).toEqual({ ok: true });
    expect(actionTest.updatedTags).toEqual(["categories"]);
  });

  it("lỗi validate không làm mới cache", async () => {
    expect((await saveCategory({ name: "Trang", slug: "", description: "" })).ok).toBe(false);
    expect(actionTest.updatedTags).toEqual([]);
  });
});
