import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeAi } from "@/platform/ai/providers/fake";
import { db } from "@/platform/db";
import { SITE_URL } from "@/platform/site";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { runThreads } from "@/modules/content-sets/actions";

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => db.$disconnect());

describe("runThreads", () => {
  it("trả chuỗi bài đã bỏ bài trống; lời nhắc có link bài trên website; không lưu gì", async () => {
    fakeAi.reply(() => ({ posts: [" Hook ", "", "Bài 2"] }));
    const res = await runThreads({ title: "Mẹo bếp", content: "<p>x</p>", slug: "meo-bep" });
    expect(res).toEqual({ ok: true, posts: ["Hook", "Bài 2"] });
    expect(fakeAi.calls()[0].user).toContain(`${SITE_URL}/bai-viet/meo-bep`);
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("thiếu tiêu đề báo UserError, không gọi AI; chưa đăng nhập bị chặn", async () => {
    expect(await runThreads({ title: " ", content: "", slug: "" })).toEqual({ ok: false, error: "Nhập tiêu đề trước" });
    expect(fakeAi.calls()).toHaveLength(0);
    actionTest.authorization = null;
    expect(await runThreads({ title: "A", content: "", slug: "a" })).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
  });
});
