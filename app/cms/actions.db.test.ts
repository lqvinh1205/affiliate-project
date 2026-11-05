import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { resetTestDb } from "@/vitest.db.helpers";
import { createPost } from "@/app/cms/actions";

// Action AI cũ còn ở `app/cms/actions.ts` (tới Epic 4); phần ghi bản nháp (`createPostDraft`) test ở
// `modules/posts/actions.db.test.ts`.

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => db.$disconnect());

describe("createPost", () => {
  it("AI không có chủ đề báo UserError, không tạo bài", async () => {
    expect(await createPost({ postType: "MEO_VAT", categoryId: "", topic: "  ", useAi: true })).toEqual({
      ok: false,
      error: "Nhập chủ đề để AI viết bài",
    });
    expect(await db.post.count()).toBe(0);
  });

  it("bản nháp trống ghi Danh mục đã chọn", async () => {
    const c = await db.category.create({ data: { name: "Nhà bếp", slug: "nha-bep" } });
    const res = await createPost({ postType: "MEO_VAT", categoryId: c.id, topic: "Mẹo bếp", useAi: false });
    expect(res.ok).toBe(true);
    expect(await db.post.findFirstOrThrow()).toMatchObject({ title: "Mẹo bếp", categoryId: c.id, status: "DRAFT" });
  });

  it("chủ đề dài quá giới hạn tiêu đề bị từ chối tại trường", async () => {
    expect(await createPost({ postType: "MEO_VAT", categoryId: "", topic: "a".repeat(201), useAi: false })).toEqual({
      ok: false,
      error: "Tối đa 200 ký tự",
    });
  });
});
