import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { recordPostView } from "@/modules/engagement/actions";
import { INVALID_INPUT_ERROR, RATE_LIMITED_ERROR, VIEW_RATE_LIMIT } from "@/modules/engagement/constants";

const BROWSER_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// Bộ giới hạn tần suất của action sống suốt file test: mỗi test một IP riêng để không ảnh hưởng nhau.
let ipSeq = 0;
function asReader(ua = BROWSER_UA) {
  ipSeq += 1;
  actionTest.authorization = null; // người đọc không đăng nhập
  actionTest.requestHeaders = { "user-agent": ua, "x-forwarded-for": `198.51.100.${ipSeq}` };
}

async function post(status: "DRAFT" | "PUBLISHED", slug = "bai") {
  return db.post.create({
    data: { title: slug, slug, content: "", postType: "MEO_VAT", status, publishedAt: status === "PUBLISHED" ? new Date() : null },
  });
}

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

describe("recordPostView (action công khai — AD-6 ngoại lệ số 1)", () => {
  it("đếm Lượt xem bài đã xuất bản khi chưa đăng nhập, không updateTag, không đổi Post.updatedAt", async () => {
    const p = await post("PUBLISHED");
    asReader();

    expect(await recordPostView({ postId: p.id })).toEqual({ ok: true, counted: true });
    expect(await recordPostView({ postId: p.id })).toEqual({ ok: true, counted: true });

    expect(await db.postStat.findUnique({ where: { postId: p.id }, select: { views: true, likes: true } })).toEqual({
      views: 2,
      likes: 0,
    });
    const days = await db.postViewDaily.findMany({ where: { postId: p.id } });
    expect(days.map((d) => d.views)).toEqual([2]);
    expect(actionTest.updatedTags).toEqual([]);
    expect((await db.post.findUniqueOrThrow({ where: { id: p.id } })).updatedAt).toEqual(p.updatedAt);
  });

  it("bài nháp hoặc không tồn tại: không ghi gì", async () => {
    const draft = await post("DRAFT");
    asReader();

    expect(await recordPostView({ postId: draft.id })).toEqual({ ok: true, counted: false });
    expect(await recordPostView({ postId: crypto.randomUUID() })).toEqual({ ok: true, counted: false });
    expect(await db.postStat.count()).toBe(0);
    expect(await db.postViewDaily.count()).toBe(0);
  });

  it("id sai định dạng: lỗi dữ liệu, không ghi", async () => {
    asReader();
    expect(await recordPostView({ postId: "khong-phai-uuid" })).toEqual({ ok: false, error: INVALID_INPUT_ERROR });
  });

  it.each([
    ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
    ["thiếu user-agent", ""],
  ])("bỏ qua bot (%s)", async (_, ua) => {
    const p = await post("PUBLISHED");
    asReader(ua);
    expect(await recordPostView({ postId: p.id })).toEqual({ ok: true, counted: false });
    expect(await db.postStat.count()).toBe(0);
  });

  it(`giới hạn ${VIEW_RATE_LIMIT.limit} lần/phút mỗi nguồn; nguồn khác vẫn gửi được`, async () => {
    const draft = await post("DRAFT"); // không ghi DB, chỉ thử bộ đếm
    const p = await post("PUBLISHED", "bai-2");
    asReader();
    for (let i = 0; i < VIEW_RATE_LIMIT.limit; i++) {
      expect((await recordPostView({ postId: draft.id })).ok).toBe(true);
    }
    expect(await recordPostView({ postId: p.id })).toEqual({ ok: false, error: RATE_LIMITED_ERROR });
    expect(await db.postStat.count()).toBe(0);

    asReader();
    expect(await recordPostView({ postId: p.id })).toEqual({ ok: true, counted: true });
  });

  it("đổi mục đầu x-forwarded-for (client giả) không thoát giới hạn", async () => {
    const draft = await post("DRAFT");
    const p = await post("PUBLISHED", "bai-2");
    asReader();
    const realIp = actionTest.requestHeaders["x-forwarded-for"];
    for (let i = 0; i < VIEW_RATE_LIMIT.limit; i++) {
      actionTest.requestHeaders["x-forwarded-for"] = `10.9.${i}.1, ${realIp}`;
      expect((await recordPostView({ postId: draft.id })).ok).toBe(true);
    }
    actionTest.requestHeaders["x-forwarded-for"] = `10.9.255.1, ${realIp}`;
    expect(await recordPostView({ postId: p.id })).toEqual({ ok: false, error: RATE_LIMITED_ERROR });
    expect(await db.postStat.count()).toBe(0);
  });
});
