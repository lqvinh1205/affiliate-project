import { describe, expect, it } from "vitest";
import { POST_TAGS_MAX, POST_TITLE_MAX } from "@/modules/posts/constants";
import { toWebPostPayload, type WebPostOutput } from "@/modules/posts/prompts/web-post.prompt";

const categories = [{ id: "7f3c2a8e-1b4d-4c6e-9f0a-2b3c4d5e6f70", name: "Nhà bếp" }];

const out = (patch: Partial<WebPostOutput> = {}): WebPostOutput => ({
  title: "Nồi chiên cho phòng trọ",
  excerpt: "Tóm tắt",
  content: "<h2>Mục</h2><p>Nấu nhanh</p><a href='https://x.vn'>mua</a><img src='https://x.vn/a.jpg'>",
  tags: ["bếp", "Bếp", "mẹo, hay"],
  seoTitle: "SEO",
  seoDescription: "Mô tả",
  seoKeywords: ["nồi chiên"],
  postType: "GOM_LINK",
  categoryId: categories[0].id,
  riskWarnings: [{ sentence: "Diệt 99% vi khuẩn", reason: "Khẳng định công dụng" }],
  ...patch,
});

describe("toWebPostPayload (FR-11, FR-13, AD-22)", () => {
  it("thân bài qua sanitizePostHtml: không link, không ảnh; thẻ bỏ trùng; Danh mục có tên", () => {
    const { payload, riskWarnings } = toWebPostPayload(out(), { categories });
    expect(payload.content).toContain("<h2>Mục</h2>");
    expect(payload.content).not.toMatch(/<a|<img/);
    expect(payload.tags).toEqual(["bếp", "mẹo hay"]);
    expect(payload).toMatchObject({ postType: "GOM_LINK", categoryId: categories[0].id, categoryName: "Nhà bếp" });
    expect(riskWarnings).toEqual([{ sentence: "Diệt 99% vi khuẩn", reason: "Khẳng định công dụng" }]);
  });

  it("Danh mục ngoài danh sách → null; cắt về giới hạn cứng thay vì từ chối", () => {
    const { payload } = toWebPostPayload(
      out({ categoryId: "khong-co", title: "t".repeat(300), tags: Array.from({ length: 30 }, (_, i) => `t${i}`) }),
      { categories },
    );
    expect(payload.categoryId).toBeNull();
    expect(payload.title).toHaveLength(POST_TITLE_MAX);
    expect(payload.tags).toHaveLength(POST_TAGS_MAX);
  });
});
