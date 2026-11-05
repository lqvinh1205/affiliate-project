// Đọc token màu từ `app/globals.css` (nguồn duy nhất, UX-DR1) để test tương phản và
// `/cms/styleguide` hiện giá trị light/dark mà không khai báo màu lần thứ hai.
// Sai định dạng thì ném lỗi ngay, để test và build không âm thầm bỏ sót token.

const LIGHT_BLOCK = /^:root\s*\{([^}]*)\}/m;
const DARK_BLOCK = /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/;
const DECL = /--([a-z0-9-]+):\s*([^;]+);/g;
const HEX = /^#[0-9a-fA-F]{6}$/;

export type ColorToken = { name: string; light: string; dark: string };

// Chỉ dòng màu nằm ở đầu khối; biến khác (bóng, alias `var(...)`) bỏ qua.
function colorDecls(block: string, mode: string): Map<string, string> {
  const decls = new Map<string, string>();
  for (const [, name, raw] of block.matchAll(DECL)) {
    const value = raw.trim();
    if (value.startsWith("var(") || name.startsWith("elevation-")) continue;
    if (!HEX.test(value)) throw new Error(`Token --${name} (${mode}) không phải mã hex 6 chữ số: ${value}`);
    decls.set(name, value.toLowerCase());
  }
  return decls;
}

export function parseColorTokens(css: string): ColorToken[] {
  const lightBlock = css.match(LIGHT_BLOCK)?.[1];
  const darkBlock = css.match(DARK_BLOCK)?.[1];
  if (lightBlock === undefined) throw new Error("Không tìm thấy khối `:root` (sáng)");
  if (darkBlock === undefined) throw new Error("Không tìm thấy khối `@media (prefers-color-scheme: dark) { :root }`");
  const light = colorDecls(lightBlock, "sáng");
  const dark = colorDecls(darkBlock, "tối");
  const onlyLight = [...light.keys()].filter((k) => !dark.has(k));
  const onlyDark = [...dark.keys()].filter((k) => !light.has(k));
  if (onlyLight.length > 0 || onlyDark.length > 0) {
    throw new Error(`Token sáng/tối không khớp; thiếu bản tối: ${onlyLight.join(", ") || "—"}; thiếu bản sáng: ${onlyDark.join(", ") || "—"}`);
  }
  return [...light].map(([name, value]) => ({ name, light: value, dark: dark.get(name) as string }));
}
