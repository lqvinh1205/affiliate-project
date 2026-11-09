import { describe, expect, it } from "vitest";
import { STYLE_PROFILE_DEFAULTS } from "@/modules/style-profiles/constants";
import { POST_EXCERPT_MAX } from "@/modules/posts/constants";
import { rewritePostPrompt, toRewrittenPost, type RewritePostOutput } from "@/modules/posts/prompts/rewrite-post.prompt";

const out = (patch: Partial<RewritePostOutput> = {}): RewritePostOutput => ({
  title: "Tiêu đề mới",
  excerpt: "Tóm tắt mới",
  content: "<h2>Mục</h2><p>Mới</p><a href='https://x.vn'>mua</a><img src='https://x.vn/a.jpg'>",
  riskWarnings: [
    { sentence: " Trắng da 100% ", reason: "Cam kết tuyệt đối" },
    { sentence: "Trắng da 100%", reason: "trùng" },
  ],
  ...patch,
});

describe("toRewrittenPost (FR-40, AD-22)", () => {
  it("HTML đã lọc link/ảnh, cảnh báo rủi ro bỏ trùng", () => {
    const r = toRewrittenPost(out(), { title: "Cũ", excerpt: "" });
    expect(r?.content).toContain("<h2>Mục</h2>");
    expect(r?.content).not.toMatch(/<a|<img/);
    expect(r?.riskWarnings).toEqual([{ sentence: "Trắng da 100%", reason: "Cam kết tuyệt đối" }]);
  });

  it("tiêu đề trống giữ tiêu đề cũ; tóm tắt cắt về giới hạn; thân rỗng → null", () => {
    const r = toRewrittenPost(out({ title: " ", excerpt: "e".repeat(600) }), { title: "Cũ", excerpt: "" });
    expect(r?.title).toBe("Cũ");
    expect(r?.excerpt).toHaveLength(POST_EXCERPT_MAX);
    expect(toRewrittenPost(out({ content: "<p></p>" }), { title: "Cũ", excerpt: "" })).toBeNull();
  });

  it("tóm tắt AI trả trống giữ tóm tắt cũ", () => {
    expect(toRewrittenPost(out({ excerpt: "  " }), { title: "Cũ", excerpt: "Tóm tắt cũ" })?.excerpt).toBe("Tóm tắt cũ");
  });

  it("system có Hồ sơ phong cách Website và quy tắc Cảnh báo rủi ro; user có chỉ dẫn khi có", () => {
    const system = rewritePostPrompt.system(STYLE_PROFILE_DEFAULTS.WEBSITE);
    expect(system).toContain(STYLE_PROFILE_DEFAULTS.WEBSITE.voice);
    expect(system).toContain("riskWarnings");
    const input = { title: "T", excerpt: "", content: "<p>x</p>", instruction: null };
    expect(rewritePostPrompt.user(input)).not.toContain("Chỉ dẫn");
    expect(rewritePostPrompt.user({ ...input, instruction: "ngắn hơn" })).toContain("Chỉ dẫn khi viết lại: ngắn hơn");
  });
});
