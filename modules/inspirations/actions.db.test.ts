import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { saveInspiration, setInspirationStatus } from "@/modules/inspirations/actions";
import { getInspirationForCms } from "@/modules/inspirations/cms-queries";

beforeEach(async () => {
  await resetTestDb();
});

afterAll(() => db.$disconnect());

const sha = "c".repeat(64);

describe("saveInspiration (FR-1)", () => {
  it("tạo Cảm hứng chỉ với một link (dán cả đoạn chia sẻ): trạng thái Mới, làm mới tag inspirations", async () => {
    const res = await saveInspiration({ url: "Mẹo gấp áo 😍 https://vt.tiktok.com/ZS1/ #meo", mediaUrl: "", note: "" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(await db.inspiration.findUniqueOrThrow({ where: { id: res.id } })).toMatchObject({
      url: "https://vt.tiktok.com/ZS1/",
      mediaUrl: null,
      note: null,
      status: "NEW",
    });
    expect(actionTest.updatedTags).toEqual(["inspirations"]);
    expect(await getInspirationForCms(res.id)).toMatchObject({ videoLink: true, label: "vt.tiktok.com", mediaKind: null });
  });

  it("tạo Cảm hứng chỉ với file video tải lên kèm ghi chú", async () => {
    const res = await saveInspiration({ url: "", mediaUrl: `/uploads/${sha}.mp4`, note: "gấp áo" });
    if (!res.ok) throw new Error(res.error);
    expect(await getInspirationForCms(res.id)).toMatchObject({ mediaKind: "video", videoLink: false, label: "gấp áo" });
  });

  it("không link, không file → UserError, không ghi", async () => {
    const res = await saveInspiration({ url: "", mediaUrl: "", note: "ý tưởng" });
    expect(res).toEqual({ ok: false, error: "Dán một link hoặc tải lên một file" });
    expect(await db.inspiration.count()).toBe(0);
    expect(actionTest.updatedTags).toEqual([]);
  });

  it("sửa: thêm file, giữ trạng thái Bỏ qua", async () => {
    const i = await db.inspiration.create({ data: { url: "https://pin.it/x", status: "SKIPPED" } });
    const res = await saveInspiration({ id: i.id, url: "https://pin.it/x", mediaUrl: `/uploads/${sha}.jpg`, note: "kệ" });
    expect(res.ok).toBe(true);
    expect(await db.inspiration.findUniqueOrThrow({ where: { id: i.id } })).toMatchObject({
      mediaUrl: `/uploads/${sha}.jpg`,
      note: "kệ",
      status: "SKIPPED",
    });
  });

  it("sửa Cảm hứng đã bị xoá → thông báo tiếng Việt", async () => {
    const res = await saveInspiration({ id: "khong-co", url: "https://pin.it/x", mediaUrl: "", note: "" });
    expect(res).toEqual({ ok: false, error: "Không tìm thấy Cảm hứng. Có thể đã bị xoá." });
  });

  it("chưa đăng nhập → bị từ chối, không ghi", async () => {
    actionTest.authorization = null;
    const res = await saveInspiration({ url: "https://pin.it/x", mediaUrl: "", note: "" });
    expect(res.ok).toBe(false);
    expect(await db.inspiration.count()).toBe(0);
  });

  it("CHECK DB: không lưu được Cảm hứng không có nguồn", async () => {
    await expect(db.inspiration.create({ data: { note: "trống" } })).rejects.toThrow();
  });
});

describe("setInspirationStatus (UX-DR61)", () => {
  it("Bỏ qua rồi Đưa lại vào Mới (Hoàn tác)", async () => {
    const i = await db.inspiration.create({ data: { url: "https://pin.it/x" } });
    expect((await setInspirationStatus({ id: i.id, status: "SKIPPED" })).ok).toBe(true);
    expect((await db.inspiration.findUniqueOrThrow({ where: { id: i.id } })).status).toBe("SKIPPED");
    expect((await setInspirationStatus({ id: i.id, status: "NEW" })).ok).toBe(true);
    expect((await db.inspiration.findUniqueOrThrow({ where: { id: i.id } })).status).toBe("NEW");
    expect(actionTest.updatedTags).toEqual(["inspirations", "inspirations"]);
  });

  it("không đặt tay được Đã dùng; Cảm hứng không có → lỗi tiếng Việt", async () => {
    const i = await db.inspiration.create({ data: { url: "https://pin.it/x" } });
    expect((await setInspirationStatus({ id: i.id, status: "USED" as never })).ok).toBe(false);
    expect(await setInspirationStatus({ id: "khong-co", status: "SKIPPED" })).toEqual({
      ok: false,
      error: "Không tìm thấy Cảm hứng. Có thể đã bị xoá.",
    });
  });

  it("chưa đăng nhập → bị từ chối", async () => {
    const i = await db.inspiration.create({ data: { url: "https://pin.it/x" } });
    actionTest.authorization = null;
    expect((await setInspirationStatus({ id: i.id, status: "SKIPPED" })).ok).toBe(false);
    expect((await db.inspiration.findUniqueOrThrow({ where: { id: i.id } })).status).toBe("NEW");
  });
});
