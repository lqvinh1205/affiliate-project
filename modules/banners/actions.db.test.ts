import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { deleteBanner, moveBanner, saveBanner } from "@/modules/banners/actions";
import type { BannerFormValues } from "@/modules/banners/schema";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

const form = (extra: Partial<BannerFormValues> = {}): BannerFormValues => ({
  title: "Săn đồ bếp 11.11",
  description: "Giảm sâu đồ bếp xinh",
  image: "/uploads/banner.jpg",
  linkUrl: "https://s.shopee.vn/abc",
  enabled: true,
  startsAt: "2026-11-11T00:00",
  endsAt: "2026-11-11T23:59",
  ...extra,
});

const titles = async () =>
  (await db.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })).map((b) => b.title);

describe("saveBanner (FR-32)", () => {
  it("tạo Banner: lịch lưu theo giờ Việt Nam, làm mới tag banners", async () => {
    const res = await saveBanner(form());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const saved = await db.banner.findUniqueOrThrow({ where: { id: res.id } });
    expect(saved).toMatchObject({
      title: "Săn đồ bếp 11.11",
      description: "Giảm sâu đồ bếp xinh",
      linkUrl: "https://s.shopee.vn/abc",
      enabled: true,
      sortOrder: 0,
    });
    expect(saved.startsAt?.toISOString()).toBe("2026-11-10T17:00:00.000Z");
    expect(saved.endsAt?.toISOString()).toBe("2026-11-11T16:59:00.000Z");
    expect(actionTest.updatedTags).toEqual(["banners"]);
  });

  it("Banner mới đứng cuối; sửa giữ thứ tự và xoá được lịch", async () => {
    await saveBanner(form({ title: "A" }));
    const b = await saveBanner(form({ title: "B" }));
    if (!b.ok) throw new Error(b.error);
    expect(await titles()).toEqual(["A", "B"]);
    const res = await saveBanner(form({ id: b.id, title: "B2", startsAt: "", endsAt: "", enabled: false }));
    expect(res.ok).toBe(true);
    expect(await titles()).toEqual(["A", "B2"]);
    expect(await db.banner.findUniqueOrThrow({ where: { id: b.id } })).toMatchObject({
      enabled: false,
      startsAt: null,
      endsAt: null,
      sortOrder: 1,
    });
  });

  it("link ngoài không phải Shopee, lịch ngược: báo lỗi tiếng Việt, không ghi, không làm mới cache", async () => {
    const bad = await saveBanner(form({ linkUrl: "https://lazada.vn/x" }));
    expect(bad).toMatchObject({ ok: false });
    const reversed = await saveBanner(form({ startsAt: "2026-11-12T00:00", endsAt: "2026-11-11T00:00" }));
    expect(reversed).toEqual({ ok: false, error: "Giờ kết thúc phải sau giờ bắt đầu" });
    expect(await db.banner.count()).toBe(0);
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("sửa Banner đã bị xoá → lỗi không tìm thấy", async () => {
    const res = await saveBanner(form({ id: "00000000-0000-4000-8000-000000000000" }));
    expect(res).toEqual({ ok: false, error: "Không tìm thấy Banner. Có thể đã bị xoá." });
  });

  it("CHECK của DB chặn lịch ngược kể cả khi ghi thẳng", async () => {
    await expect(
      db.banner.create({
        data: {
          title: "X",
          image: "/uploads/x.jpg",
          linkUrl: "/bio",
          startsAt: new Date("2026-11-12T00:00:00Z"),
          endsAt: new Date("2026-11-11T00:00:00Z"),
        },
      }),
    ).rejects.toThrow();
  });

  it("chưa đăng nhập bị chặn, không ghi", async () => {
    actionTest.authorization = null;
    expect((await saveBanner(form())).ok).toBe(false);
    expect(await db.banner.count()).toBe(0);
  });
});

describe("moveBanner, deleteBanner", () => {
  it("lên/xuống đổi chỗ, đánh số lại khi trùng thứ tự; đầu/cuối không đổi", async () => {
    const base = { image: "/uploads/x.jpg", linkUrl: "/bio" };
    const a = await db.banner.create({ data: { ...base, title: "A", sortOrder: 0, createdAt: new Date(1) } });
    await db.banner.create({ data: { ...base, title: "B", sortOrder: 0, createdAt: new Date(2) } });
    const c = await db.banner.create({ data: { ...base, title: "C", sortOrder: 0, createdAt: new Date(3) } });
    expect(await moveBanner({ id: c.id, direction: "up" })).toEqual({ ok: true });
    expect(await titles()).toEqual(["A", "C", "B"]);
    expect(actionTest.updatedTags).toEqual(["banners"]);
    expect(await moveBanner({ id: a.id, direction: "up" })).toEqual({ ok: true });
    expect(await titles()).toEqual(["A", "C", "B"]);
  });

  it("xoá Banner; xoá lần nữa vẫn xong", async () => {
    const a = await db.banner.create({ data: { title: "A", image: "/uploads/x.jpg", linkUrl: "/bio" } });
    expect(await deleteBanner({ id: a.id })).toEqual({ ok: true });
    expect(await deleteBanner({ id: a.id })).toEqual({ ok: true });
    expect(await db.banner.count()).toBe(0);
    expect(actionTest.updatedTags).toEqual(["banners", "banners"]);
  });

  it("chưa đăng nhập không đổi thứ tự, không xoá", async () => {
    const a = await db.banner.create({ data: { title: "A", image: "/uploads/x.jpg", linkUrl: "/bio" } });
    actionTest.authorization = null;
    expect((await deleteBanner({ id: a.id })).ok).toBe(false);
    expect((await moveBanner({ id: a.id, direction: "down" })).ok).toBe(false);
    expect(await db.banner.count()).toBe(1);
  });
});
