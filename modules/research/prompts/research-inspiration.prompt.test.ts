import { describe, expect, it } from "vitest";
import {
  inspirationResearchSchema,
  researchInspirationPrompt,
  toInspirationResearchPayload,
} from "@/modules/research/prompts/research-inspiration.prompt";

const out = {
  summary: "  Mẹo gấp áo thun nhanh bằng tấm bìa.  ",
  keywords: ["bảng gấp quần áo", "Bảng gấp quần áo", "  ", "kẹp phơi đồ", "x".repeat(200)],
  outline: [
    { heading: "Mở bài", detail: "Vì sao gấp áo mất thời gian" },
    { heading: "", detail: "Các bước" },
  ],
};

describe("toInspirationResearchPayload (FR-2)", () => {
  it("gán id ổn định, bỏ từ khoá trống/trùng, cắt về giới hạn, đặt tên mục trống", () => {
    const p = toInspirationResearchPayload(out);
    expect(p.summary).toBe("Mẹo gấp áo thun nhanh bằng tấm bìa.");
    expect(p.keywords.map((k) => k.id)).toEqual(["tu-khoa-1", "tu-khoa-2", "tu-khoa-3"]);
    expect(p.keywords[0].text).toBe("bảng gấp quần áo");
    expect(p.keywords[2].text).toHaveLength(80);
    expect(p.outline).toEqual([
      { id: "muc-1", heading: "Mở bài", detail: "Vì sao gấp áo mất thời gian" },
      { id: "muc-2", heading: "Mục 2", detail: "Các bước" },
    ]);
  });

  it("không còn từ khoá nào → lỗi schema (không ghi hồ sơ rỗng)", () => {
    expect(() => toInspirationResearchPayload({ ...out, keywords: [" "] })).toThrow();
  });
});

describe("inspirationResearchSchema (form sửa)", () => {
  it("từ khoá trống báo lỗi tại trường", () => {
    const p = toInspirationResearchPayload(out);
    const r = inspirationResearchSchema.safeParse({ ...p, keywords: [{ id: "tu-khoa-1", text: " " }] });
    expect(!r.success && r.error.issues[0].message).toBe("Nhập từ khoá");
  });
});

describe("researchInspirationPrompt", () => {
  it("lời nhắc nêu link video, ghi chú, file và chỉ dẫn", () => {
    const user = researchInspirationPrompt.user({
      url: "https://vt.tiktok.com/x/",
      videoLink: true,
      note: "gấp áo",
      hasImage: false,
      hasVideoFile: true,
      instruction: "ngắn hơn",
    });
    expect(user).toContain("https://vt.tiktok.com/x/ (link video)");
    expect(user).toContain("gấp áo");
    expect(user).toContain("1 file video");
    expect(user).toContain("Chỉ dẫn khi viết lại: ngắn hơn");
  });
});
