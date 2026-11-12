import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { SITE_URL } from "@/platform/site";
import { resetTestDb } from "@/vitest.db.helpers";
import sitemap from "@/app/sitemap";

beforeEach(async () => {
  await resetTestDb();
  await db.post.create({
    data: { title: "m", slug: "m", content: "<p>x</p>", postType: "MEO_VAT", status: "PUBLISHED", publishedAt: new Date() },
  });
});

afterAll(() => db.$disconnect());

describe("sitemap", () => {
  it("chỉ có trang Loại bài đã có bài xuất bản (Loại bài rỗng là trang mỏng, AD-26)", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/meo-vat`);
    expect(urls).not.toContain(`${SITE_URL}/gom-link`);
  });
});
