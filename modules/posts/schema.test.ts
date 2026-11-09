import { describe, expect, it } from "vitest";
import {
  POST_EXCERPT_MAX,
  POST_IMPORT_URL_MAX,
  POST_PRODUCTS_MAX,
  POST_REWRITE_INSTRUCTION_MAX,
  POST_TAGS_MAX,
  POST_TITLE_MAX,
} from "@/modules/posts/constants";
import {
  importPostInputSchema,
  newPostInputSchema,
  rewritePostInputSchema,
  postInputSchema,
  setPostStatusInputSchema,
  type PostFormValues,
} from "@/modules/posts/schema";

const valid: PostFormValues = {
  id: "p1",
  title: " Mẹo bếp ",
  slug: "",
  excerpt: "",
  featuredImage: "",
  postType: "MEO_VAT",
  categoryId: "",
  content: "<p>x</p>",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  productIds: [],
};

function errorAt(patch: Partial<PostFormValues>, field: string) {
  const r = postInputSchema.safeParse({ ...valid, ...patch });
  expect(r.success).toBe(false);
  return r.error?.issues.find((i) => i.path[0] === field)?.message;
}

describe("postInputSchema", () => {
  it("cắt khoảng trắng, trường tuỳ chọn trống thành null, thẻ trống thành mảng rỗng", () => {
    expect(postInputSchema.parse(valid)).toMatchObject({
      title: "Mẹo bếp",
      slug: "",
      excerpt: null,
      featuredImage: null,
      categoryId: null,
      tags: [],
      seoKeywords: [],
      productIds: [],
    });
  });

  it("thẻ cách nhau bằng dấu phẩy: bỏ trống, bỏ trùng không phân biệt hoa thường", () => {
    expect(postInputSchema.parse({ ...valid, tags: " bếp ,, mẹo,Bếp, MẸO " }).tags).toEqual(["bếp", "mẹo"]);
  });

  it(`tóm tắt tối đa ${POST_EXCERPT_MAX} ký tự (= @db.VarChar, [NO-12])`, () => {
    expect(postInputSchema.safeParse({ ...valid, excerpt: "a".repeat(POST_EXCERPT_MAX) }).success).toBe(true);
    expect(errorAt({ excerpt: "a".repeat(POST_EXCERPT_MAX + 1) }, "excerpt")).toBe(`Tối đa ${POST_EXCERPT_MAX} ký tự`);
  });

  it("thiếu tiêu đề, tiêu đề quá dài báo tại trường", () => {
    expect(errorAt({ title: "  " }, "title")).toBe("Nhập tiêu đề");
    expect(errorAt({ title: "a".repeat(POST_TITLE_MAX + 1) }, "title")).toBe(`Tối đa ${POST_TITLE_MAX} ký tự`);
  });

  it("slug có nhập thì phải đúng dạng", () => {
    expect(postInputSchema.parse({ ...valid, slug: " meo-bep-2 " }).slug).toBe("meo-bep-2");
    expect(errorAt({ slug: "Mẹo bếp" }, "slug")).toMatch(/^Đường dẫn chỉ gồm/);
  });

  it(`quá ${POST_TAGS_MAX} thẻ báo tại trường tags`, () => {
    const many = Array.from({ length: POST_TAGS_MAX + 1 }, (_, i) => `t${i}`).join(",");
    expect(errorAt({ tags: many }, "tags")).toBe(`Tối đa ${POST_TAGS_MAX} thẻ`);
  });

  it("Sản phẩm giữ thứ tự, không trùng, tối đa giới hạn", () => {
    expect(postInputSchema.parse({ ...valid, productIds: ["b", "a"] }).productIds).toEqual(["b", "a"]);
    expect(errorAt({ productIds: ["a", "a"] }, "productIds")).toBe("Sản phẩm bị gắn trùng");
    const many = Array.from({ length: POST_PRODUCTS_MAX + 1 }, (_, i) => `p${i}`);
    expect(errorAt({ productIds: many }, "productIds")).toBe(`Tối đa ${POST_PRODUCTS_MAX} Sản phẩm mỗi bài`);
  });

  it("ảnh đại diện ngoài host cho phép bị từ chối", () => {
    expect(errorAt({ featuredImage: "https://evil.example/a.jpg" }, "featuredImage")).toBeTruthy();
  });

  it("Danh mục không phải uuid bị từ chối", () => {
    expect(errorAt({ categoryId: "abc" }, "categoryId")).toBe("Danh mục không hợp lệ");
  });
});

describe("newPostInputSchema / setPostStatusInputSchema", () => {
  it("Loại bài phải là enum PostType", () => {
    expect(newPostInputSchema.safeParse({ postType: "KHAC", categoryId: "", topic: "" }).success).toBe(false);
    expect(newPostInputSchema.parse({ postType: "GOM_LINK", categoryId: "", topic: " x " })).toEqual({
      postType: "GOM_LINK",
      categoryId: null,
      topic: "x",
    });
  });

  it("chủ đề tuỳ chọn, tối đa bằng giới hạn tiêu đề", () => {
    expect(newPostInputSchema.safeParse({ postType: "MEO_VAT", categoryId: "", topic: " " }).success).toBe(true);
    expect(
      newPostInputSchema.safeParse({ postType: "MEO_VAT", categoryId: "", topic: "a".repeat(POST_TITLE_MAX + 1) }).success,
    ).toBe(false);
  });

  it("trạng thái chỉ DRAFT / PUBLISHED", () => {
    expect(setPostStatusInputSchema.safeParse({ id: "p", status: "ARCHIVED" }).success).toBe(false);
  });
});

describe("importPostInputSchema (FR-39)", () => {
  it("nhận URL http(s), cắt khoảng trắng", () => {
    expect(importPostInputSchema.parse({ url: " https://blog.vn/bai " })).toEqual({ url: "https://blog.vn/bai" });
    expect(importPostInputSchema.safeParse({ url: "http://blog.vn" }).success).toBe(true);
  });

  it("từ chối URL sai dạng, giao thức khác, rỗng, quá dài", () => {
    for (const url of ["abc", "ftp://blog.vn/a", "javascript:alert(1)", "", `https://blog.vn/${"a".repeat(POST_IMPORT_URL_MAX)}`]) {
      expect(importPostInputSchema.safeParse({ url }).success).toBe(false);
    }
  });
});

describe("rewritePostInputSchema (FR-40)", () => {
  const ok = { title: "T", excerpt: "", content: "<p>x</p>", instruction: "" };

  it("chỉ dẫn tuỳ chọn, tối đa 200 ký tự", () => {
    expect(rewritePostInputSchema.safeParse(ok).success).toBe(true);
    expect(rewritePostInputSchema.safeParse({ ...ok, instruction: "a".repeat(POST_REWRITE_INSTRUCTION_MAX + 1) }).success).toBe(false);
  });

  it("tiêu đề, tóm tắt quá giới hạn bị từ chối", () => {
    expect(rewritePostInputSchema.safeParse({ ...ok, title: "a".repeat(POST_TITLE_MAX + 1) }).success).toBe(false);
    expect(rewritePostInputSchema.safeParse({ ...ok, excerpt: "a".repeat(POST_EXCERPT_MAX + 1) }).success).toBe(false);
  });
});
