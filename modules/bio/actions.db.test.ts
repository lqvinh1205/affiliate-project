import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { moveBioItem, saveBioSettings, setBioItemPinned, setBioItemVisible } from "@/modules/bio/actions";
import { getBioForCms } from "@/modules/bio/cms-queries";
import { BIO_SETTINGS_DEFAULTS } from "@/modules/bio/constants";
import { getBioPage } from "@/modules/bio/queries";

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => db.$disconnect());

const created = (n: number) => new Date(Date.UTC(2026, 10, n));

async function product(name: string, day: number, extra: { hidden?: boolean; categoryId?: string } = {}) {
  return db.product.create({
    data: { name, affiliateUrl: `https://shopee.vn/${encodeURIComponent(name)}`, createdAt: created(day), ...extra },
  });
}

const cmsNames = async () => {
  const { pinned, rest } = await getBioForCms();
  return { pinned: pinned.map((p) => p.name), rest: rest.map((p) => p.name) };
};
const publicNames = async () => (await getBioPage()).items.map((p) => p.name);

describe("Giới thiệu và câu công khai (FR-31)", () => {
  it("chưa lưu: dùng giá trị khởi tạo, không ghi DB; lưu hai lần vẫn một bản ghi", async () => {
    expect((await getBioForCms()).settings).toEqual(BIO_SETTINGS_DEFAULTS);
    expect(await getBioPage()).toMatchObject(BIO_SETTINGS_DEFAULTS);
    expect(await db.bioSettings.count()).toBe(0);

    expect(await saveBioSettings({ intro: "Chào bạn", disclosure: "Mình nhận hoa hồng." })).toEqual({ ok: true });
    expect(await saveBioSettings({ intro: "Chào bạn nhé", disclosure: "Mình nhận hoa hồng nhỏ." })).toEqual({ ok: true });
    expect(await db.bioSettings.count()).toBe(1);
    expect(await getBioPage()).toMatchObject({ intro: "Chào bạn nhé", disclosure: "Mình nhận hoa hồng nhỏ." });
    expect(actionTest.updatedTags).toEqual(["bio", "bio"]);
  });

  it("câu công khai rỗng bị từ chối; chưa đăng nhập bị chặn", async () => {
    expect(await saveBioSettings({ intro: "Chào", disclosure: " " })).toEqual({ ok: false, error: "Nhập câu công khai" });
    actionTest.authorization = null;
    expect(await saveBioSettings({ intro: "Chào", disclosure: "Có" })).toEqual({
      ok: false,
      error: "Bạn cần đăng nhập CMS",
    });
    expect(await setBioItemVisible({ productId: "x", visible: false })).toEqual({
      ok: false,
      error: "Bạn cần đăng nhập CMS",
    });
    expect(await db.bioSettings.count()).toBe(0);
  });
});

describe("Chọn món, ghim, sắp thứ tự (FR-31, UX-DR49)", () => {
  it("Sản phẩm mới mặc định hiện, mới nhất trước; Sản phẩm ẩn không có ở CMS lẫn /bio", async () => {
    await product("Cũ", 1);
    await product("Mới", 3);
    await product("Ẩn", 2, { hidden: true });
    expect(await cmsNames()).toEqual({ pinned: [], rest: ["Mới", "Cũ"] });
    expect(await publicNames()).toEqual(["Mới", "Cũ"]);
    expect(await db.bioItem.count()).toBe(0);
  });

  it("tắt Hiện trên bio: mất khỏi /bio, vẫn ở CMS với Switch tắt; bật lại hiện lại", async () => {
    const a = await product("A", 1);
    await product("B", 2);
    expect(await setBioItemVisible({ productId: a.id, visible: false })).toEqual({ ok: true });
    expect(await publicNames()).toEqual(["B"]);
    expect((await getBioForCms()).rest.map((p) => [p.name, p.visible])).toEqual([
      ["B", true],
      ["A", false],
    ]);
    await setBioItemVisible({ productId: a.id, visible: true });
    expect(await publicNames()).toEqual(["B", "A"]);
    expect(actionTest.updatedTags).toEqual(["bio", "bio"]);
  });

  it("ghim: theo thứ tự đặt, đứng đầu /bio; bỏ ghim về chỗ theo ngày tạo", async () => {
    const a = await product("A", 1);
    const b = await product("B", 2);
    await product("C", 3);
    await setBioItemPinned({ productId: a.id, pinned: true });
    await setBioItemPinned({ productId: b.id, pinned: true });
    expect(await cmsNames()).toEqual({ pinned: ["A", "B"], rest: ["C"] });
    expect((await getBioPage()).items.map((p) => [p.name, p.pinned])).toEqual([
      ["A", true],
      ["B", true],
      ["C", false],
    ]);
    // Ghim lại món đang ghim không đổi thứ tự.
    await setBioItemPinned({ productId: a.id, pinned: true });
    expect((await cmsNames()).pinned).toEqual(["A", "B"]);
    await setBioItemPinned({ productId: a.id, pinned: false });
    expect(await cmsNames()).toEqual({ pinned: ["B"], rest: ["C", "A"] });
  });

  it("lên/xuống trong từng nhóm, không vượt nhóm; thấy ngay trên /bio", async () => {
    const a = await product("A", 1);
    const b = await product("B", 2);
    const c = await product("C", 3);
    const d = await product("D", 4);
    await setBioItemPinned({ productId: a.id, pinned: true });
    await setBioItemPinned({ productId: b.id, pinned: true });

    expect(await moveBioItem({ productId: b.id, direction: "up" })).toEqual({ ok: true });
    expect(await moveBioItem({ productId: c.id, direction: "up" })).toEqual({ ok: true });
    expect(await cmsNames()).toEqual({ pinned: ["B", "A"], rest: ["C", "D"] });
    // Món đầu nhóm còn lại không lên nhóm ghim; món cuối không xuống.
    await moveBioItem({ productId: c.id, direction: "up" });
    await moveBioItem({ productId: d.id, direction: "down" });
    expect(await publicNames()).toEqual(["B", "A", "C", "D"]);
    // Sản phẩm mới tạo sau vẫn lên đầu nhóm còn lại.
    await db.product.create({ data: { name: "E", affiliateUrl: "https://shopee.vn/e" } });
    expect(await publicNames()).toEqual(["B", "A", "E", "C", "D"]);
  });

  it("Sản phẩm cùng ngày tạo vẫn sắp được", async () => {
    const [x, y, z] = [await product("X", 1), await product("Y", 1), await product("Z", 1)];
    const before = (await cmsNames()).rest;
    const last = [x, y, z].find((p) => p.name === before[2])!;
    await moveBioItem({ productId: last.id, direction: "up" });
    expect((await cmsNames()).rest).toEqual([before[0], before[2], before[1]]);
  });

  it("Sản phẩm ẩn hoặc không tồn tại: báo lỗi, không ghi; ẩn Sản phẩm biến khỏi /bio dù đang ghim", async () => {
    const a = await product("A", 1);
    const hidden = await product("H", 2, { hidden: true });
    const err = { ok: false, error: "Sản phẩm không còn trong Kho hoặc đang ẩn. Tải lại trang." };
    expect(await setBioItemPinned({ productId: hidden.id, pinned: true })).toEqual(err);
    expect(await moveBioItem({ productId: "khong-co", direction: "up" })).toEqual(err);
    expect(await db.bioItem.count()).toBe(0);

    await setBioItemPinned({ productId: a.id, pinned: true });
    // Ẩn bằng `db` (AD-2: không import action của `products`; action ẩn đã `updateTag(products)` — test ở `products`).
    await db.product.update({ where: { id: a.id }, data: { hidden: true } });
    expect(await publicNames()).toEqual([]);
    expect(await cmsNames()).toEqual({ pinned: [], rest: [] });
  });

  it("xoá Sản phẩm xoá trạng thái bio của nó", async () => {
    const a = await product("A", 1);
    await setBioItemPinned({ productId: a.id, pinned: true });
    await db.product.delete({ where: { id: a.id } });
    expect(await db.bioItem.count()).toBe(0);
  });
});
