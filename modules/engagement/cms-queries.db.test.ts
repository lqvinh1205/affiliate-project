import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { CMS_POST_PAGE_SIZE } from "@/modules/posts/constants";
import { getPostStatsForCms, listPostsByStatForCms } from "@/modules/engagement/cms-queries";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

// Bài sửa lần cuối cách nhau 1 phút theo thứ tự tạo (bài tạo sau = sửa gần hơn); `views` null = không có PostStat.
async function seedPosts(
  rows: { title: string; views: number | null; likes?: number; status?: "DRAFT" | "PUBLISHED" }[],
) {
  const base = Date.UTC(2026, 10, 1);
  const created = [];
  for (const [i, r] of rows.entries()) {
    const p = await db.post.create({
      data: {
        title: r.title,
        slug: r.title,
        content: "",
        postType: "MEO_VAT",
        status: r.status ?? "PUBLISHED",
        updatedAt: new Date(base + i * 60_000),
        ...(r.views !== null && { stat: { create: { views: r.views, likes: r.likes ?? 0 } } }),
      },
    });
    created.push(p);
  }
  return created;
}

describe("getPostStatsForCms", () => {
  it("trả Lượt xem, Lượt tim theo id, bài chưa có PostStat = 0", async () => {
    const [a, b] = await seedPosts([
      { title: "a", views: 7, likes: 2 },
      { title: "b", views: null },
    ]);
    expect(await getPostStatsForCms([a.id, b.id])).toEqual({
      [a.id]: { views: 7, likes: 2 },
      [b.id]: { views: 0, likes: 0 },
    });
    expect(await getPostStatsForCms([])).toEqual({});
  });
});

describe("listPostsByStatForCms — Lượt tim", () => {
  it("xếp Lượt tim giảm dần; bài 0 tim / chưa có PostStat xếp sau theo sửa gần nhất", async () => {
    await seedPosts([
      { title: "it-tim", views: 100, likes: 1 },
      { title: "khong-stat", views: null },
      { title: "nhieu-tim", views: 1, likes: 9 },
      { title: "xem-khong-tim", views: 50, likes: 0 },
    ]);
    const { items } = await listPostsByStatForCms({ status: null, q: "", page: 1, by: "likes" });
    expect(items.map((p) => [p.title, p.likes, p.views])).toEqual([
      ["nhieu-tim", 9, 1],
      ["it-tim", 1, 100],
      ["xem-khong-tim", 0, 50],
      ["khong-stat", 0, 0],
    ]);
  });
});

describe("listPostsByStatForCms — Lượt xem", () => {
  it("xếp Lượt xem giảm dần; bài 0 lượt xem / chưa có PostStat xếp sau theo sửa gần nhất", async () => {
    await seedPosts([
      { title: "it", views: 5 },
      { title: "khong-stat", views: null },
      { title: "nhieu", views: 50 },
      { title: "stat-0", views: 0 },
      { title: "bang-it", views: 5 },
    ]);
    const { items, total, page } = await listPostsByStatForCms({ status: null, q: "", page: 1, by: "views" });
    // "bang-it" và "it" cùng 5 lượt: sửa gần nhất trước.
    expect(items.map((p) => [p.title, p.views])).toEqual([
      ["nhieu", 50],
      ["bang-it", 5],
      ["it", 5],
      ["stat-0", 0],
      ["khong-stat", 0],
    ]);
    expect([total, page]).toEqual([5, 1]);
  });

  it("dùng chung bộ lọc trạng thái và tiêu đề với danh sách mặc định", async () => {
    await seedPosts([
      { title: "meo-bep", views: 3 },
      { title: "meo-giat", views: 9, status: "DRAFT" },
      { title: "do-bep", views: 1 },
    ]);
    const res = await listPostsByStatForCms({ status: "PUBLISHED", q: "MEO", page: 1, by: "views" });
    expect(res.items.map((p) => p.title)).toEqual(["meo-bep"]);
    expect(res.total).toBe(1);
  });

  it("phân trang qua ranh giới bài có / chưa có lượt xem, kẹp trang vượt", async () => {
    const viewed = CMS_POST_PAGE_SIZE - 1;
    await seedPosts([
      ...Array.from({ length: viewed }, (_, i) => ({ title: `v${String(i).padStart(2, "0")}`, views: i + 1 })),
      { title: "z1", views: null },
      { title: "z2", views: null },
      { title: "z3", views: null },
    ]);
    const p1 = await listPostsByStatForCms({ status: null, q: "", page: 1, by: "views" });
    expect(p1.items).toHaveLength(CMS_POST_PAGE_SIZE);
    expect(p1.items[0]).toMatchObject({ title: `v${viewed - 1}`, views: viewed });
    expect(p1.items.at(-1)).toMatchObject({ title: "z3", views: 0 });

    const p2 = await listPostsByStatForCms({ status: null, q: "", page: 2, by: "views" });
    expect(p2.items.map((p) => p.title)).toEqual(["z2", "z1"]);

    const clamped = await listPostsByStatForCms({ status: null, q: "", page: 9, by: "views" });
    expect(clamped.page).toBe(2);
    expect(clamped.items.map((p) => p.title)).toEqual(["z2", "z1"]);
  });
});
