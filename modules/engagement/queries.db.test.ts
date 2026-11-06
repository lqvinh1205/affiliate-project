import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { vietnamDay } from "@/platform/format";
import { cacheTagsOf, resetTestDb } from "@/vitest.db.helpers";
import { getPopularPosts } from "@/modules/engagement/queries";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => {
  vi.useRealTimers();
  return db.$disconnect();
});

const NOW = new Date("2026-11-06T05:00:00Z"); // 12:00 ngày 06/11 giờ Việt Nam
const daysAgo = (n: number) => vietnamDay(new Date(NOW.getTime() - n * 86_400_000));

let seq = 0;
async function postWithViews(views: [daysAgo: number, views: number][], status: "PUBLISHED" | "DRAFT" = "PUBLISHED") {
  seq += 1;
  const slug = `bai-${seq}`;
  return db.post.create({
    data: {
      title: slug,
      slug,
      content: "<p>x</p>",
      postType: "MEO_VAT",
      status,
      publishedAt: status === "PUBLISHED" ? new Date(Date.UTC(2026, 0, seq)) : null,
      viewDays: { create: views.map(([ago, v]) => ({ day: daysAgo(ago), views: v })) },
    },
  });
}

describe("getPopularPosts — Xem nhiều (FR-34)", () => {
  it("xếp theo tổng Lượt xem 30 ngày gần nhất (tính cả hôm nay); bỏ lượt xem cũ hơn, bài nháp, bài không có lượt xem", async () => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    const a = await postWithViews([[0, 3], [29, 4]]); // 7 trong cửa sổ
    const b = await postWithViews([[1, 10], [30, 100]]); // 10 (ngày thứ 31 bị bỏ)
    const c = await postWithViews([[5, 2]]);
    await postWithViews([[31, 500]]); // chỉ có lượt xem ngoài cửa sổ
    await postWithViews([[0, 50]], "DRAFT");
    await postWithViews([]);

    const popular = await getPopularPosts(5);
    expect(popular.map((p) => p.slug)).toEqual([b.slug, a.slug, c.slug]);
    // Thẻ PostCard đủ cột (ảnh fallback, phút đọc).
    expect(popular[0]).toMatchObject({ title: b.title, postType: "MEO_VAT" });
    expect(popular[0]).toHaveProperty("readingMinutes");
    expect(popular[0]).not.toHaveProperty("id");
  });

  it("tối đa `limit` bài; bằng Lượt xem thì theo id (thứ tự ổn định)", async () => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    const posts = [];
    for (let i = 0; i < 7; i++) posts.push(await postWithViews([[0, 10 + i]]));
    const tie = await postWithViews([[0, 16]]); // bằng bài nhiều nhất
    const five = await getPopularPosts(5);
    const expected = [posts[6], tie].sort((x, y) => x.id.localeCompare(y.id)).concat(posts[5], posts[4], posts[3]);
    expect(five.map((p) => p.slug)).toEqual(expected.map((p) => p.slug));
  });

  it("chưa có lượt xem nào: rỗng (khu Xem nhiều ẩn)", async () => {
    await postWithViews([]);
    expect(await getPopularPosts(5)).toEqual([]);
  });

  it("gắn tag engagement, posts, products (AD-7: mọi bảng được đọc, gồm ảnh fallback từ Sản phẩm)", async () => {
    expect((await cacheTagsOf(() => getPopularPosts(5))).sort()).toEqual(["engagement", "posts", "products"]);
  });
});
