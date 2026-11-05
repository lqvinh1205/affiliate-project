import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseColorTokens } from "@/platform/design-tokens";

const css = readFileSync(fileURLToPath(new URL("./globals.css", import.meta.url)), "utf8");
const tokens = parseColorTokens(css);
const byName = new Map(tokens.map((t) => [t.name, t]));

// 15 token chỉ-light của DESIGN.md (comment frontmatter `colors`): không được thành biến.
const LIGHT_ONLY = [
  "primary-fixed-dim",
  "on-primary-fixed-variant",
  "inverse-primary",
  "surface-tint",
  "secondary-fixed",
  "secondary-fixed-dim",
  "on-secondary-fixed",
  "on-secondary-fixed-variant",
  "on-tertiary",
  "tertiary-container",
  "on-tertiary-container",
  "tertiary-fixed-dim",
  "on-tertiary-fixed-variant",
  "surface-dim",
  "surface-bright",
];

// Cặp chữ / nền theo bảng vai trò màu và bảng tương phản của DESIGN.md (UX-DR4).
// `outline`, `outline-variant` chỉ cho viền/icon nên không có ở đây.
// `brand-secondary` = token `secondary` của DESIGN.md (đổi tên vì trùng biến shadcn).
const TEXT_PAIRS: [text: string, bg: string][] = [
  ["on-surface", "surface"],
  ["on-surface-variant", "surface"],
  ["on-surface", "surface-container-lowest"],
  ["on-surface-variant", "surface-container-lowest"],
  ["on-surface", "surface-container-low"],
  ["on-surface-variant", "surface-container-low"],
  ["on-surface", "surface-container-high"], // mục đang chọn CmsShell (+ vạch primary, đậm 600)
  ["on-surface-variant", "surface-container-high"],
  ["on-surface", "surface-container"], // hover mục menu và "Xem site" CmsShell
  ["primary", "surface"],
  ["primary", "surface-container-lowest"], // giá trên thẻ (dark: headline-sm 600)
  ["on-primary", "primary"],
  ["on-primary-container", "primary-container"], // nút Shopee (chữ ≥ 12px, đậm 500)
  ["on-primary-fixed", "primary-fixed"],
  ["on-surface", "primary-fixed"], // Callout
  ["on-secondary", "brand-secondary"],
  ["on-secondary-container", "secondary-container"], // badge Mẹo vặt
  ["on-tertiary-fixed", "tertiary-fixed"], // badge Gom link
  ["error", "surface"],
  ["error", "surface-container-lowest"],
  ["on-error", "error"],
  ["on-error-container", "error-container"],
  ["inverse-on-surface", "inverse-surface"], // Toast
];

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("token màu trong app/globals.css", () => {
  it("đọc được token màu", () => {
    expect(tokens.length).toBeGreaterThan(20);
  });

  it("không khai báo token chỉ-light", () => {
    expect(tokens.filter((t) => LIGHT_ONLY.includes(t.name)).map((t) => t.name)).toEqual([]);
  });
});

describe("tương phản chữ / nền đạt WCAG AA (≥ 4.5:1)", () => {
  for (const mode of ["light", "dark"] as const) {
    it(`mọi cặp ở chế độ ${mode === "light" ? "sáng" : "tối"}`, () => {
      const failures = TEXT_PAIRS.flatMap(([text, bg]) => {
        const fg = byName.get(text)?.[mode];
        const back = byName.get(bg)?.[mode];
        if (!fg || !back) return [`${text} / ${bg}: thiếu token`];
        const ratio = contrast(fg, back);
        return ratio >= 4.5 ? [] : [`${text} / ${bg}: ${ratio.toFixed(2)}:1`];
      });
      expect(failures).toEqual([]);
    });
  }
});
