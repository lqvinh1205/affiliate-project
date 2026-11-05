import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { PAGE_SIZE } from "@/modules/posts/constants";
import { loadPostTypePage } from "@/app/(site)/_components/post-type-route";

vi.mock("next/navigation", () => ({
  permanentRedirect: (url: string) => {
    throw new Error(`308 ${url}`);
  },
  notFound: () => {
    throw new Error("404");
  },
}));

beforeEach(async () => {
  await resetTestDb();
  // PAGE_SIZE + 1 bài Mẹo vặt đã xuất bản → 2 trang.
  for (let i = 0; i <= PAGE_SIZE; i++) {
    await db.post.create({
      data: { title: `b${i}`, slug: `b${i}`, content: "<p>x</p>", postType: "MEO_VAT", status: "PUBLISHED", publishedAt: new Date() },
    });
  }
});

afterAll(() => db.$disconnect());

describe("loadPostTypePage", () => {
  it('"1" → 308 về trang gốc', async () => {
    await expect(loadPostTypePage("MEO_VAT", "1")).rejects.toThrow("308 /meo-vat");
  });

  it('"abc" → 404', async () => {
    await expect(loadPostTypePage("MEO_VAT", "abc")).rejects.toThrow("404");
  });

  it("trang hợp lệ trả dữ liệu trang đó", async () => {
    const { page, data } = await loadPostTypePage("MEO_VAT", "2");
    expect(page).toBe(2);
    expect(data).toMatchObject({ total: PAGE_SIZE + 1, pages: 2 });
    expect(data.items).toHaveLength(1);
  });

  it("vượt trang cuối (pages + 1) → 404", async () => {
    await expect(loadPostTypePage("MEO_VAT", "3")).rejects.toThrow("404");
  });
});
