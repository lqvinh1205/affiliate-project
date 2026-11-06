import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/platform/db";
import { cacheTagsOf, resetTestDb } from "@/vitest.db.helpers";
import { getBannerForCms, listBannersForCms } from "@/modules/banners/cms-queries";
import { getLiveBanners } from "@/modules/banners/queries";

const NOW = new Date("2026-11-11T05:00:00Z"); // 12:00 ngày 11/11 giờ Việt Nam

beforeEach(async () => {
  await resetTestDb();
  // Chỉ giả `Date` (không giả timer): Prisma/pg vẫn chạy bình thường.
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
});

afterEach(() => vi.useRealTimers());

afterAll(() => db.$disconnect());

let seq = 0;
async function banner(
  title: string,
  extra: { enabled?: boolean; startsAt?: Date; endsAt?: Date; sortOrder?: number; linkUrl?: string } = {},
) {
  return db.banner.create({
    data: {
      title,
      image: "/uploads/x.jpg",
      linkUrl: "/bio",
      createdAt: new Date(Date.UTC(2026, 10, 1, 0, 0, ++seq)),
      ...extra,
    },
  });
}

const hour = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

describe("getLiveBanners (FR-32, AD-7)", () => {
  it("chỉ gắn tag banners", async () => {
    expect(await cacheTagsOf(() => getLiveBanners())).toEqual(["banners"]);
  });

  it("chỉ Banner đang bật và trong lịch, theo thứ tự; chỉ trường hiển thị", async () => {
    await banner("Tắt", { enabled: false, sortOrder: 0 });
    await banner("Chờ lịch", { startsAt: hour(1), sortOrder: 1 });
    await banner("Hết hạn", { endsAt: hour(-1), sortOrder: 2 });
    await banner("Sau", { startsAt: hour(-1), endsAt: hour(1), sortOrder: 4 });
    await banner("Trước", { sortOrder: 3 });
    const live = await getLiveBanners();
    expect(live.map((b) => b.title)).toEqual(["Trước", "Sau"]);
    expect(Object.keys(live[0]).sort()).toEqual(["description", "id", "image", "linkUrl", "title"]);
  });

  it("thời điểm lấy bên trong hàm: qua giờ kết thúc thì lần đọc sau không còn Banner", async () => {
    await banner("11.11", { endsAt: hour(0.5) });
    expect((await getLiveBanners()).map((b) => b.title)).toEqual(["11.11"]);
    vi.setSystemTime(hour(0.5));
    expect(await getLiveBanners()).toEqual([]);
  });

  it("bỏ dòng có link đích không hợp lệ (ghi thẳng DB) để thẻ không thành link ngoài sai FR-25", async () => {
    await banner("Lạ", { linkUrl: "https://lazada.vn/x" });
    await banner("Vòng host", { linkUrl: "//evil.example/x" });
    await banner("Shopee", { linkUrl: "https://s.shopee.vn/abc" });
    await banner("Trong site", { linkUrl: "/bio" });
    expect((await getLiveBanners()).map((b) => b.title)).toEqual(["Shopee", "Trong site"]);
  });

  it("0 Banner → mảng rỗng", async () => {
    expect(await getLiveBanners()).toEqual([]);
  });
});

describe("listBannersForCms, getBannerForCms", () => {
  it("mọi Banner theo thứ tự hiển thị, kèm trạng thái của cùng hàm với site", async () => {
    await banner("Đang hiện", { sortOrder: 0 });
    await banner("Tắt", { enabled: false, sortOrder: 1 });
    await banner("Chờ lịch", { startsAt: hour(2), sortOrder: 2 });
    const expired = await banner("Hết hạn", { endsAt: hour(-2), sortOrder: 3 });
    const list = await listBannersForCms();
    expect(list.map((b) => [b.title, b.status])).toEqual([
      ["Đang hiện", "LIVE"],
      ["Tắt", "OFF"],
      ["Chờ lịch", "SCHEDULED"],
      ["Hết hạn", "EXPIRED"],
    ]);
    expect((await getBannerForCms(expired.id))?.status).toBe("EXPIRED");
    expect(await getBannerForCms("00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});
