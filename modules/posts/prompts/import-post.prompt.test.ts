import { describe, expect, it } from "vitest";
import { POST_IMPORT_IMAGES_MAX, POST_TITLE_MAX } from "@/modules/posts/constants";
import { importPostPrompt, toImportedPost, type ImportPostOutput } from "@/modules/posts/prompts/import-post.prompt";

const out = (patch: Partial<ImportPostOutput> = {}): ImportPostOutput => ({
  readable: true,
  title: " Mẹo giặt áo trắng ",
  excerpt: "Sapo",
  content: "<h2>Mục</h2><p>Ngâm <a href='https://x.vn'>baking soda</a></p><img src='https://x.vn/a.jpg'><script>x</script>",
  imageUrls: ["https://x.vn/a.jpg", "https://x.vn/a.jpg", "ftp://x.vn/b.jpg", "khong-phai-url", " http://x.vn/c.png "],
  ...patch,
});

describe("toImportedPost (FR-39, AD-22)", () => {
  it("thân bài qua sanitizePostHtml: không link, không ảnh, không script; link ảnh http(s) không trùng", () => {
    const r = toImportedPost(out());
    expect(r?.title).toBe("Mẹo giặt áo trắng");
    expect(r?.content).toContain("<h2>Mục</h2>");
    expect(r?.content).toContain("baking soda");
    expect(r?.content).not.toMatch(/<a|<img|<script/);
    expect(r?.imageUrls).toEqual(["https://x.vn/a.jpg", "http://x.vn/c.png"]);
  });

  it("cắt tiêu đề về giới hạn, link ảnh tối đa 20", () => {
    const r = toImportedPost(
      out({ title: "t".repeat(300), imageUrls: Array.from({ length: 30 }, (_, i) => `https://x.vn/${i}.jpg`) }),
    );
    expect(r?.title).toHaveLength(POST_TITLE_MAX);
    expect(r?.imageUrls).toHaveLength(POST_IMPORT_IMAGES_MAX);
  });

  it("AI báo không đọc được, hoặc thân bài sau lọc rỗng → null", () => {
    expect(toImportedPost(out({ readable: false }))).toBeNull();
    expect(toImportedPost(out({ content: "<p> </p><img src='https://x.vn/a.jpg'>" }))).toBeNull();
  });

  it("prompt chỉ chứa URL trong lời nhắn, yêu cầu chép nguyên văn", () => {
    expect(importPostPrompt.user({ url: "https://blog.vn/bai" })).toContain("https://blog.vn/bai");
    expect(importPostPrompt.system()).toContain("NGUYÊN VĂN");
  });
});
