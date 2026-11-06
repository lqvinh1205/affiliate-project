import { describe, expect, it } from "vitest";
import { STYLE_PLATFORM_KEYS, STYLE_PROFILE_DEFAULTS } from "@/modules/style-profiles/constants";
import { styleProfileInputSchema, type StyleProfileFormValues } from "@/modules/style-profiles/schema";

const n = (v: number | null) => (v === null ? "" : String(v));

function formOf(platform: (typeof STYLE_PLATFORM_KEYS)[number]): StyleProfileFormValues {
  const d = STYLE_PROFILE_DEFAULTS[platform];
  return {
    platform,
    voice: d.voice,
    lengthMin: n(d.lengthMin),
    lengthMax: n(d.lengthMax),
    partsMin: n(d.partsMin),
    partsMax: n(d.partsMax),
    emoji: d.emoji,
    forbidden: d.forbidden,
    rules: d.rules,
    disclosure: d.disclosure ?? "",
  };
}

function errorAt(values: StyleProfileFormValues, path: string) {
  const r = styleProfileInputSchema.safeParse(values);
  return r.success ? null : (r.error.issues.find((i) => i.path.join(".") === path)?.message ?? null);
}

describe("styleProfileInputSchema", () => {
  it("giá trị khởi tạo của cả ba nền tảng hợp lệ (FR-13, FR-14, FR-15)", () => {
    for (const p of STYLE_PLATFORM_KEYS) expect(styleProfileInputSchema.safeParse(formOf(p)).success).toBe(true);
    expect(STYLE_PROFILE_DEFAULTS.THREADS).toMatchObject({ lengthMax: 250, partsMin: 4, partsMax: 7 });
    expect(STYLE_PROFILE_DEFAULTS.WEBSITE).toMatchObject({ lengthMin: 600, lengthMax: 900, partsMin: 3, partsMax: 5 });
    expect(STYLE_PROFILE_DEFAULTS.FACEBOOK).toMatchObject({ lengthMin: 80, lengthMax: 250, partsMin: null });
  });

  it("Threads > 500 ký tự/bài báo lỗi tại trường nêu giới hạn cứng (AD-25)", () => {
    expect(errorAt({ ...formOf("THREADS"), lengthMax: "501" }, "lengthMax")).toBe("Tối đa 500 ký tự (giới hạn cứng)");
    expect(errorAt({ ...formOf("THREADS"), lengthMax: "500" }, "lengthMax")).toBeNull();
    expect(errorAt({ ...formOf("THREADS"), partsMax: "11" }, "partsMax")).toBe("Tối đa 10 bài (giới hạn cứng)");
    expect(errorAt({ ...formOf("WEBSITE"), lengthMax: "3001" }, "lengthMax")).toBe("Tối đa 3000 từ (giới hạn cứng)");
  });

  it("tối thiểu lớn hơn tối đa, số không hợp lệ báo tại trường", () => {
    expect(errorAt({ ...formOf("FACEBOOK"), lengthMin: "300" }, "lengthMin")).toBe("Không được lớn hơn mức tối đa");
    expect(errorAt({ ...formOf("FACEBOOK"), lengthMin: "abc" }, "lengthMin")).toBe("Nhập số nguyên dương");
    expect(errorAt({ ...formOf("WEBSITE"), partsMin: "" }, "partsMin")).toBe("Nhập số tối thiểu");
  });

  it("Facebook không có số bài; câu công khai chỉ ở Threads, Facebook (FR-18)", () => {
    expect(errorAt({ ...formOf("FACEBOOK"), partsMin: "2" }, "partsMin")).toBe("Facebook không có mục này");
    expect(errorAt({ ...formOf("WEBSITE"), disclosure: "Có link affiliate" }, "disclosure")).toBe(
      "Website không có câu công khai",
    );
    const r = styleProfileInputSchema.parse({ ...formOf("THREADS"), disclosure: "  Mình nhận hoa hồng " });
    expect(r.disclosure).toBe("Mình nhận hoa hồng");
    expect(styleProfileInputSchema.parse(formOf("THREADS")).disclosure).toBeNull();
  });

  it("giọng văn bắt buộc, chữ quá dài báo giới hạn", () => {
    expect(errorAt({ ...formOf("WEBSITE"), voice: " " }, "voice")).toBe("Nhập giọng văn");
    expect(errorAt({ ...formOf("WEBSITE"), emoji: "x".repeat(301) }, "emoji")).toBe("Tối đa 300 ký tự");
  });
});
