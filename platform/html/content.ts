import { slugify } from "@/platform/slug";

export type Heading = { id: string; text: string };

export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Gắn id cho các thẻ <h2> (HTML đã sanitize nên h2 không còn thuộc tính) để làm mục lục.
export function withHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    let id = slugify(text) || `muc-${headings.length + 1}`;
    if (headings.some((h) => h.id === id)) id = `${id}-${headings.length + 1}`;
    headings.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, headings };
}
