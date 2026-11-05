import { describe, expect, it } from "vitest";
import { parseColorTokens } from "@/platform/design-tokens";

const css = (light: string, dark: string) =>
  `:root {\n${light}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n${dark}\n  }\n}\n`;

describe("parseColorTokens", () => {
  it("đọc cặp sáng/tối, bỏ qua alias var() và bóng", () => {
    const tokens = parseColorTokens(
      css(
        "--surface: #FFF8F5;\n--elevation-0: 0 1px 8px rgba(0, 0, 0, 0.04);\n--background: var(--surface);",
        "--surface: #1f1b18;\n--elevation-0: none;",
      ),
    );
    expect(tokens).toEqual([{ name: "surface", light: "#fff8f5", dark: "#1f1b18" }]);
  });

  it("ném lỗi khi thiếu khối sáng", () => {
    expect(() => parseColorTokens("@media (prefers-color-scheme: dark) { :root { --a: #000000; } }")).toThrow(/sáng/);
  });

  it("ném lỗi khi thiếu khối tối", () => {
    expect(() => parseColorTokens(":root {\n--a: #000000;\n}")).toThrow(/dark/);
  });

  it("ném lỗi khi màu không phải hex 6 chữ số", () => {
    expect(() => parseColorTokens(css("--a: #fff;", "--a: #000000;"))).toThrow(/--a/);
    expect(() => parseColorTokens(css("--a: #ffffff;", "--a: oklch(0.2 0 0);"))).toThrow(/--a/);
  });

  it("ném lỗi khi tập token sáng và tối khác nhau", () => {
    expect(() => parseColorTokens(css("--a: #ffffff;\n--b: #ffffff;", "--a: #000000;"))).toThrow(/b/);
    expect(() => parseColorTokens(css("--a: #ffffff;", "--a: #000000;\n--c: #000000;"))).toThrow(/c/);
  });
});
