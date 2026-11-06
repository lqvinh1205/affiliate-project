import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { recordPostViewRecord } from "@/modules/engagement/service";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

describe("recordPostViewRecord", () => {
  it("tạo PostStat lười, cộng dồn; PostViewDaily tách theo ngày giờ Việt Nam", async () => {
    const p = await db.post.create({
      data: { title: "a", slug: "a", content: "", postType: "MEO_VAT", status: "PUBLISHED", publishedAt: new Date() },
    });
    expect(await db.postStat.findUnique({ where: { postId: p.id } })).toBeNull();

    // 16:30 và 16:59 UTC ngày 5 = ngày 5 ở Việt Nam; 17:00 UTC = 00:00 ngày 6.
    expect(await recordPostViewRecord(p.id, new Date("2026-11-05T16:30:00Z"))).toBe(true);
    expect(await recordPostViewRecord(p.id, new Date("2026-11-05T16:59:00Z"))).toBe(true);
    expect(await recordPostViewRecord(p.id, new Date("2026-11-05T17:00:00Z"))).toBe(true);

    expect((await db.postStat.findUniqueOrThrow({ where: { postId: p.id } })).views).toBe(3);
    const days = await db.postViewDaily.findMany({ where: { postId: p.id }, orderBy: { day: "asc" } });
    expect(days.map((d) => [d.day.toISOString().slice(0, 10), d.views])).toEqual([
      ["2026-11-05", 2],
      ["2026-11-06", 1],
    ]);
  });

  it("xoá bài thì xoá số đếm của bài", async () => {
    const p = await db.post.create({
      data: { title: "a", slug: "a", content: "", postType: "MEO_VAT", status: "PUBLISHED", publishedAt: new Date() },
    });
    await recordPostViewRecord(p.id);
    await db.post.delete({ where: { id: p.id } });
    expect(await db.postStat.count()).toBe(0);
    expect(await db.postViewDaily.count()).toBe(0);
  });
});
