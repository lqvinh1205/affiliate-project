import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { saveStyleProfile } from "@/modules/style-profiles/actions";
import { getStyleProfileForCms, listStyleProfilesForCms } from "@/modules/style-profiles/cms-queries";
import { STYLE_PROFILE_DEFAULTS } from "@/modules/style-profiles/constants";
import type { StyleProfileFormValues } from "@/modules/style-profiles/schema";

beforeEach(async () => {
  await resetTestDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => db.$disconnect());

const threads: StyleProfileFormValues = {
  platform: "THREADS",
  voice: "Vui",
  lengthMin: "50",
  lengthMax: "300",
  partsMin: "3",
  partsMax: "5",
  emoji: "Ít",
  forbidden: "Không link",
  rules: "Hook",
  disclosure: "Mình nhận hoa hồng.",
};

describe("Hồ sơ phong cách (FR-18)", () => {
  it("lần đầu: ba hồ sơ dùng giá trị khởi tạo, không ghi DB", async () => {
    const list = await listStyleProfilesForCms();
    expect(list.map((p) => [p.platform, p.id])).toEqual([
      ["WEBSITE", null],
      ["THREADS", null],
      ["FACEBOOK", null],
    ]);
    expect(list[1]).toMatchObject(STYLE_PROFILE_DEFAULTS.THREADS);
    expect(await db.styleProfile.count()).toBe(0);
  });

  it("lưu: upsert theo nền tảng, lần sau đọc bản đã lưu; lưu lại không tạo bản ghi thứ hai", async () => {
    expect((await saveStyleProfile(threads)).ok).toBe(true);
    expect((await saveStyleProfile({ ...threads, voice: "Vui hơn" })).ok).toBe(true);
    expect(await db.styleProfile.count()).toBe(1);
    expect(await getStyleProfileForCms("THREADS")).toMatchObject({
      voice: "Vui hơn",
      lengthMax: 300,
      partsMin: 3,
      disclosure: "Mình nhận hoa hồng.",
    });
    expect(actionTest.updatedTags).toEqual(["style-profiles", "style-profiles"]);
  });

  it("vượt giới hạn cứng báo lỗi, không lưu; chưa đăng nhập bị chặn", async () => {
    expect(await saveStyleProfile({ ...threads, lengthMax: "501" })).toEqual({
      ok: false,
      error: "Tối đa 500 ký tự (giới hạn cứng)",
    });
    actionTest.authorization = null;
    expect(await saveStyleProfile(threads)).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
    expect(await db.styleProfile.count()).toBe(0);
  });
});
