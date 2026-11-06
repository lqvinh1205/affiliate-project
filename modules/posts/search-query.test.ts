import { describe, expect, it } from "vitest";
import { searchQueryTerms } from "@/modules/posts/search-query";
import { searchPostsInputSchema } from "@/modules/posts/schema";

describe("searchQueryTerms", () => {
  it("đủ để tìm: trả các từ đã gấp, tối đa 8 từ", () => {
    expect(searchQueryTerms("Nồi chiên")).toEqual(["noi", "chien"]);
    expect(searchQueryTerms("a b c d e f g h i j")).toHaveLength(8);
  });

  it("gấp xong không đủ 2 ký tự hoặc quá 100 ký tự: chưa tìm (null)", () => {
    for (const q of ["a", "C++", "c#", "??", "%_", "a!", "a.", "đ!", "🍳", "%_%", "x".repeat(101)]) {
      expect(searchQueryTerms(q), q).toBeNull();
    }
  });

  it("server dùng cùng luật: client gửi gì thì server nhận đó", () => {
    for (const q of ["C++", "🍳", "x".repeat(101)]) expect(searchPostsInputSchema.safeParse({ q }).success).toBe(false);
    expect(searchPostsInputSchema.parse({ q: "Giặt ĐỒ" }).q).toEqual(["giat", "do"]);
  });
});
