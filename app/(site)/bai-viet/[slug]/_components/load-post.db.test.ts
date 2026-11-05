import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { postInputSchema } from "@/modules/posts/schema";
import { savePostRecord } from "@/modules/posts/service";
import { loadPost } from "@/app/(site)/bai-viet/[slug]/_components/load-post";

// `permanentRedirect`/`notFound` của Next ném lỗi điều khiển; ở đây ném lỗi có thể so được.
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
});

afterAll(() => db.$disconnect());

async function rename(id: string, slug: string) {
  await savePostRecord(
    postInputSchema.parse({
      id,
      title: "Bài",
      slug,
      excerpt: "",
      featuredImage: "",
      postType: "MEO_VAT",
      categoryId: "",
      content: "<p>x</p>",
      tags: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      productIds: [],
    }),
  );
}

describe("loadPost (FR-27, AD-20)", () => {
  it("slug hiện tại trả bài; đổi a → b → c thì a, b đều 308 sang c", async () => {
    const p = await db.post.create({
      data: { title: "Bài", slug: "a", content: "<p>x</p>", postType: "MEO_VAT", status: "PUBLISHED", publishedAt: new Date() },
    });
    await rename(p.id, "b");
    await rename(p.id, "c");
    expect(await loadPost("c")).toMatchObject({ slug: "c" });
    await expect(loadPost("a")).rejects.toThrow("308 /bai-viet/c");
    await expect(loadPost("b")).rejects.toThrow("308 /bai-viet/c");
  });

  it("slug không tồn tại → 404; bài đã về nháp thì slug cũ cũng 404", async () => {
    await expect(loadPost("khong-co")).rejects.toThrow("404");
    const p = await db.post.create({
      data: { title: "Bài", slug: "a", content: "<p>x</p>", postType: "MEO_VAT", status: "PUBLISHED", publishedAt: new Date() },
    });
    await rename(p.id, "b");
    await db.post.update({ where: { id: p.id }, data: { status: "DRAFT" } });
    await expect(loadPost("a")).rejects.toThrow("404");
    await expect(loadPost("b")).rejects.toThrow("404");
  });
});
