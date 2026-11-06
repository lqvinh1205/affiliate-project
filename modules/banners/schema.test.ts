import { describe, expect, it } from "vitest";
import { BANNER_DESCRIPTION_MAX, BANNER_LINK_MAX, BANNER_TITLE_MAX } from "@/modules/banners/constants";
import { bannerInputSchema, type BannerFormValues } from "@/modules/banners/schema";

const valid: BannerFormValues = {
  title: "  Săn đồ bếp 11.11  ",
  description: "",
  image: "/uploads/banner.jpg",
  linkUrl: "https://s.shopee.vn/abc",
  enabled: true,
  startsAt: "",
  endsAt: "",
};

const firstMessage = (values: BannerFormValues) => {
  const r = bannerInputSchema.safeParse(values);
  return r.success ? null : r.error.issues[0];
};

describe("bannerInputSchema", () => {
  it("hợp lệ: cắt khoảng trắng, trường trống → null", () => {
    expect(bannerInputSchema.parse(valid)).toEqual({
      title: "Săn đồ bếp 11.11",
      description: null,
      image: "/uploads/banner.jpg",
      linkUrl: "https://s.shopee.vn/abc",
      enabled: true,
      startsAt: null,
      endsAt: null,
    });
  });

  it("lịch nhập theo giờ Việt Nam", () => {
    const parsed = bannerInputSchema.parse({ ...valid, startsAt: "2026-11-11T00:00", endsAt: "2026-11-11T23:59" });
    expect(parsed.startsAt?.toISOString()).toBe("2026-11-10T17:00:00.000Z");
    expect(parsed.endsAt?.toISOString()).toBe("2026-11-11T16:59:00.000Z");
  });

  it("kết thúc không sau bắt đầu → lỗi ở trường kết thúc", () => {
    for (const endsAt of ["2026-11-11T00:00", "2026-11-10T23:00"]) {
      const issue = firstMessage({ ...valid, startsAt: "2026-11-11T00:00", endsAt });
      expect(issue?.path).toEqual(["endsAt"]);
      expect(issue?.message).toBe("Giờ kết thúc phải sau giờ bắt đầu");
    }
  });

  it("ngày giờ sai dạng", () => {
    expect(firstMessage({ ...valid, startsAt: "2026-02-30T00:00" })?.message).toBe("Ngày giờ không hợp lệ");
  });

  it("thiếu tiêu đề, ảnh, link; quá dài", () => {
    expect(firstMessage({ ...valid, title: " " })?.message).toBe("Nhập tiêu đề");
    expect(firstMessage({ ...valid, image: "" })?.message).toBe("Chọn ảnh hoặc dán link ảnh");
    expect(firstMessage({ ...valid, linkUrl: "" })?.message).toBe("Nhập link đích");
    expect(firstMessage({ ...valid, title: "a".repeat(BANNER_TITLE_MAX + 1) })?.message).toBe(
      `Tối đa ${BANNER_TITLE_MAX} ký tự`,
    );
    expect(firstMessage({ ...valid, description: "a".repeat(BANNER_DESCRIPTION_MAX + 1) })?.path).toEqual([
      "description",
    ]);
    expect(firstMessage({ ...valid, linkUrl: `https://shopee.vn/${"a".repeat(BANNER_LINK_MAX)}` })?.path).toEqual([
      "linkUrl",
    ]);
  });

  it("ảnh phải từ host cho phép; link sang ngoài chỉ nhận Shopee chính chủ", () => {
    expect(firstMessage({ ...valid, image: "https://evil.com/a.jpg" })?.path).toEqual(["image"]);
    expect(firstMessage({ ...valid, image: "//evil.com/a.jpg" })?.path).toEqual(["image"]);
    expect(firstMessage({ ...valid, linkUrl: "https://lazada.vn/x" })?.message).toMatch(/shopee\.vn/);
    expect(firstMessage({ ...valid, linkUrl: "https://shopee.vn.evil.com/x" })?.path).toEqual(["linkUrl"]);
    expect(bannerInputSchema.safeParse({ ...valid, linkUrl: "/bio" }).success).toBe(true);
  });
});
