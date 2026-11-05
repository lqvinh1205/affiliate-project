import { slugify } from "@/platform/slug";

export type Heading = { id: string; text: string };

// Chữ người đọc thấy (bỏ thẻ, gộp khoảng trắng): `<p></p>` hay `<p> </p>` là thân bài rỗng.
export function visibleText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingMinutes(html: string): number {
  const words = visibleText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Gắn id cho các thẻ <h2> (HTML đã sanitize nên h2 không còn thuộc tính) để làm mục lục. `reservedIds`: id các khối
// khác trên trang (khối Sản phẩm, vùng nội dung chính…) — h2 trùng thì thêm hậu tố, không để hai phần tử cùng id.
export function withHeadingIds(html: string, reservedIds: readonly string[] = []): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const taken = new Set(reservedIds);
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const base = slugify(text) || `muc-${headings.length + 1}`;
    let id = base;
    for (let n = headings.length + 1; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    headings.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, headings };
}
