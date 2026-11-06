import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { markPosted, recordCopy, saveLinkComment, saveSocialPost, unmarkPosted } from "@/modules/content-sets/actions";
import {
  getContentSetForCms,
  listContentSetsForProductForCms,
  listPostedPlatformsByProductForCms,
} from "@/modules/content-sets/cms-queries";

let productId: string;

// Bộ nội dung có bài Threads + Facebook đã Duyệt (dựng thẳng bằng DB; luồng Duyệt có test ở `suggestions`).
async function setWithPosts() {
  const set = await db.contentSet.create({
    data: {
      angleName: "Gọn",
      products: { create: [{ productId, sortOrder: 0 }] },
      socialPosts: {
        create: [
          { platform: "THREADS", parts: ["Hook", "Bài 2"], linkComment: "Link: https://s.shopee.vn/a" },
          { platform: "FACEBOOK", parts: ["Bài Facebook"] },
        ],
      },
    },
    include: { socialPosts: true },
  });
  const threads = set.socialPosts.find((s) => s.platform === "THREADS")!;
  const facebook = set.socialPosts.find((s) => s.platform === "FACEBOOK")!;
  return { set, threads, facebook };
}

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
  productId = (await db.product.create({ data: { name: "Nồi", affiliateUrl: "https://s.shopee.vn/a" } })).id;
});

afterAll(() => db.$disconnect());

describe("Sửa bài mạng xã hội đã Duyệt (FR-22)", () => {
  it("Threads giữ số bài, mỗi bài ≤ 500 ký tự; Facebook một phần; Bình luận đã Duyệt mới sửa được", async () => {
    const { threads, facebook } = await setWithPosts();
    expect((await saveSocialPost({ id: threads.id, content: { posts: ["Mới 1", "Mới 2"] } })).ok).toBe(true);
    expect((await db.socialPost.findUniqueOrThrow({ where: { id: threads.id } })).parts).toEqual(["Mới 1", "Mới 2"]);
    expect(await saveSocialPost({ id: threads.id, content: { posts: ["Một"] } })).toEqual({
      ok: false,
      error: "Không thêm/xoá bài trong chuỗi. Muốn đổi số bài thì Tạo lại.",
    });
    expect(await saveSocialPost({ id: threads.id, content: { posts: ["a", "x".repeat(501)] } })).toEqual({
      ok: false,
      error: "Bài 2 vượt 500 ký tự",
    });
    expect((await saveSocialPost({ id: facebook.id, content: { body: " Bài mới " } })).ok).toBe(true);
    expect((await db.socialPost.findUniqueOrThrow({ where: { id: facebook.id } })).parts).toEqual(["Bài mới"]);
    expect((await saveLinkComment({ id: threads.id, content: { comment: "Link mới https://s.shopee.vn/a" } })).ok).toBe(true);
    expect(await saveLinkComment({ id: facebook.id, content: { comment: "x" } })).toEqual({
      ok: false,
      error: "Bình luận chưa được duyệt. Tải lại trang.",
    });
    expect(actionTest.updatedTags.every((t) => t === "content-sets")).toBe(true);
  });
});

describe("Copy và đánh dấu đã đăng (FR-19, FR-20, AD-21)", () => {
  it("copy sau Duyệt ghi firstCopiedAt lần đầu, lần sau không đổi", async () => {
    const { facebook } = await setWithPosts();
    await recordCopy({ id: facebook.id });
    const first = (await db.socialPost.findUniqueOrThrow({ where: { id: facebook.id } })).firstCopiedAt;
    expect(first).not.toBeNull();
    await recordCopy({ id: facebook.id });
    expect((await db.socialPost.findUniqueOrThrow({ where: { id: facebook.id } })).firstCopiedAt).toEqual(first);
  });

  it("đánh dấu đã đăng kèm link (kiểm URL), Sản phẩm hiện đã lên nền tảng nào; bỏ đánh dấu được", async () => {
    const { set, facebook } = await setWithPosts();
    expect(await markPosted({ id: facebook.id, postUrl: "javascript:alert(1)" })).toEqual({
      ok: false,
      error: "Link bài đăng phải bắt đầu bằng http:// hoặc https://",
    });
    expect((await markPosted({ id: facebook.id, postUrl: " " })).ok).toBe(true);
    expect(await db.socialPost.findUniqueOrThrow({ where: { id: facebook.id } })).toMatchObject({ postUrl: null });
    expect((await markPosted({ id: facebook.id, postUrl: "https://facebook.com/p/1" })).ok).toBe(true);
    const view = await getContentSetForCms(set.id);
    expect(view?.socialPosts.find((s) => s.platform === "FACEBOOK")).toMatchObject({ postUrl: "https://facebook.com/p/1" });
    expect(typeof view?.socialPosts[0].firstCopiedAt === "string" || view?.socialPosts[0].firstCopiedAt === null).toBe(true);
    expect((await listPostedPlatformsByProductForCms([productId])).get(productId)).toEqual(["FACEBOOK"]);
    expect((await listContentSetsForProductForCms(productId))[0]).toMatchObject({ id: set.id, title: "Gọn", posted: ["FACEBOOK"] });

    expect((await unmarkPosted({ id: facebook.id })).ok).toBe(true);
    expect(await db.socialPost.findUniqueOrThrow({ where: { id: facebook.id } })).toMatchObject({ postedAt: null, postUrl: null });
    expect((await listPostedPlatformsByProductForCms([productId])).get(productId)).toEqual([]);
    expect(await markPosted({ id: "khong-co", postUrl: "" })).toEqual({
      ok: false,
      error: "Không tìm thấy bài mạng xã hội. Tải lại trang.",
    });
  });

  it("Website = có Bài web đã xuất bản gắn Sản phẩm; chưa đăng nhập bị chặn", async () => {
    await db.post.create({
      data: {
        title: "Bài",
        slug: "bai",
        content: "<p>x</p>",
        postType: "MEO_VAT",
        status: "PUBLISHED",
        publishedAt: new Date(),
        postProducts: { create: [{ productId, sortOrder: 0 }] },
      },
    });
    expect((await listPostedPlatformsByProductForCms([productId])).get(productId)).toEqual(["WEBSITE"]);
    const { facebook } = await setWithPosts();
    actionTest.authorization = null;
    expect(await markPosted({ id: facebook.id, postUrl: "" })).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
  });
});
