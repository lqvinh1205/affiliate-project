import { describe, expect, it } from "vitest";
import { bannerStatus } from "@/modules/banners/status";

const at = (iso: string) => new Date(iso);
const now = at("2026-11-11T05:00:00Z");

describe("bannerStatus (AD-7: một hàm cho cả site và CMS)", () => {
  it("tắt luôn là Tắt, kể cả trong lịch", () => {
    expect(bannerStatus({ enabled: false, startsAt: null, endsAt: null }, now)).toBe("OFF");
    expect(bannerStatus({ enabled: false, startsAt: at("2026-11-10T17:00:00Z"), endsAt: null }, now)).toBe("OFF");
  });

  it("bật, không lịch → Đang hiện", () => {
    expect(bannerStatus({ enabled: true, startsAt: null, endsAt: null }, now)).toBe("LIVE");
  });

  it("chưa tới giờ bắt đầu → Chờ lịch; đúng giờ bắt đầu → Đang hiện", () => {
    const startsAt = at("2026-11-11T05:00:00Z");
    expect(bannerStatus({ enabled: true, startsAt, endsAt: null }, at("2026-11-11T04:59:59Z"))).toBe("SCHEDULED");
    expect(bannerStatus({ enabled: true, startsAt, endsAt: null }, startsAt)).toBe("LIVE");
  });

  it("tới đúng giờ kết thúc → Hết hạn", () => {
    const endsAt = at("2026-11-11T05:00:00Z");
    expect(bannerStatus({ enabled: true, startsAt: null, endsAt }, at("2026-11-11T04:59:59Z"))).toBe("LIVE");
    expect(bannerStatus({ enabled: true, startsAt: null, endsAt }, endsAt)).toBe("EXPIRED");
  });

  it("dịp 11.11 giờ Việt Nam: 00:00 → 23:59 ngày 11/11", () => {
    const schedule = { enabled: true, startsAt: at("2026-11-10T17:00:00Z"), endsAt: at("2026-11-11T16:59:00Z") };
    expect(bannerStatus(schedule, at("2026-11-10T16:59:00Z"))).toBe("SCHEDULED"); // 23:59 ngày 10/11 giờ VN
    expect(bannerStatus(schedule, at("2026-11-10T17:00:00Z"))).toBe("LIVE");
    expect(bannerStatus(schedule, at("2026-11-11T17:00:00Z"))).toBe("EXPIRED");
  });
});
