import { describe, expect, it } from "vitest";
import { extractLink, inspirationInputSchema } from "@/modules/inspirations/schema";

const sha = "b".repeat(64);
const parse = (v: Partial<{ url: string; mediaUrl: string; note: string }>) =>
  inspirationInputSchema.safeParse({ url: "", mediaUrl: "", note: "", ...v });

describe("extractLink", () => {
  it("giữ nguyên link; lấy link đầu tiên trong đoạn chữ chia sẻ, bỏ dấu câu cuối", () => {
    expect(extractLink("  https://vt.tiktok.com/ZS123/ ")).toBe("https://vt.tiktok.com/ZS123/");
    expect(extractLink("Mẹo gấp áo siêu nhanh 😍 https://vt.tiktok.com/ZS123/ #meovat")).toBe("https://vt.tiktok.com/ZS123/");
    expect(extractLink("Xem nè (https://pin.it/abc).")).toBe("https://pin.it/abc");
    expect(extractLink("không có link")).toBe("không có link");
  });
});

describe("inspirationInputSchema (FR-1)", () => {
  it("chỉ cần một link; trường khác để trống thành null", () => {
    const r = parse({ url: "https://www.tiktok.com/@a/video/1" });
    expect(r.success && r.data).toEqual({ url: "https://www.tiktok.com/@a/video/1", mediaUrl: null, note: null });
  });

  it("chỉ cần một file đã tải lên", () => {
    const r = parse({ mediaUrl: `/uploads/${sha}.mp4`, note: "  gấp áo  " });
    expect(r.success && r.data).toEqual({ url: null, mediaUrl: `/uploads/${sha}.mp4`, note: "gấp áo" });
  });

  it("không link, không file → lỗi tại ô link", () => {
    const r = parse({ note: "ý tưởng" });
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0]).toMatchObject({ path: ["url"], message: "Dán một link hoặc tải lên một file" });
  });

  it.each(["javascript:alert(1)", "ftp://x.vn/a", "tiktok.com/abc"])("từ chối link %s", (url) => {
    const r = parse({ url });
    expect(!r.success && r.error.issues[0].message).toBe("Link phải bắt đầu bằng http:// hoặc https://");
  });

  it("từ chối file không phải do route upload trả", () => {
    const r = parse({ mediaUrl: "https://evil.example/x.mp4" });
    expect(!r.success && r.error.issues[0].message).toBe("File phải tải lên bằng nút Chọn ảnh hoặc video");
  });

  it("giới hạn độ dài link và ghi chú", () => {
    expect(parse({ url: `https://x.vn/${"a".repeat(2000)}` }).success).toBe(false);
    expect(parse({ url: "https://x.vn", note: "a".repeat(501) }).success).toBe(false);
    expect(parse({ url: "https://x.vn", note: "a".repeat(500) }).success).toBe(true);
  });
});
