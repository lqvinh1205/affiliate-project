// Tìm kiếm không dấu (FR-36, spine "Tìm kiếm không dấu"): cùng một cách gấp chữ cho cột `Post.searchText` lúc ghi,
// cho từ khoá lúc tìm và cho highlight phía client. Hàm thuần, dùng được ở server và trình duyệt.

// Gấp một ký tự: bỏ dấu tiếng Việt, đ → d, chữ thường; dấu rời (chữ tổ hợp NFD) thành rỗng; ký tự không phải
// chữ/số thành khoảng trắng.
function foldChar(c: string) {
  const base = c
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
  return base === "" || /^[a-z0-9]+$/.test(base) ? base : " ";
}

// "Nồi chiên  KHÔNG-dầu!" → "noi chien khong dau".
export function toSearchText(...parts: (string | null | undefined)[]) {
  return Array.from(parts.filter(Boolean).join(" "), foldChar).join("").replace(/\s+/g, " ").trim();
}

// Từ khoá người đọc gõ → các từ đã gấp, không trùng (bài phải chứa đủ mọi từ).
export function searchTerms(query: string) {
  return [...new Set(toSearchText(query).split(" ").filter(Boolean))];
}

export type HighlightPart = { text: string; match: boolean };

// Tách `text` thành đoạn khớp / không khớp với `terms` (đã gấp), so trên chữ đã gấp nhưng trả chữ gốc có dấu:
// highlightParts("Nồi chiên", ["noi"]) → [{ "Nồi", match }, { " chiên" }].
export function highlightParts(text: string, terms: string[]): HighlightPart[] {
  const chars = Array.from(text);
  // Chuỗi đã gấp và vị trí ký tự gốc của từng ký tự gấp (một ký tự gốc có thể gấp ra nhiều ký tự).
  let folded = "";
  const origin: number[] = [];
  chars.forEach((c, i) => {
    const f = foldChar(c);
    folded += f;
    for (let k = 0; k < f.length; k++) origin.push(i);
  });
  const marked = new Array<boolean>(chars.length).fill(false);
  for (const term of terms) {
    if (!term) continue;
    for (let at = folded.indexOf(term); at !== -1; at = folded.indexOf(term, at + 1)) {
      for (let k = at; k < at + term.length; k++) marked[origin[k]] = true;
    }
  }
  const parts: HighlightPart[] = [];
  chars.forEach((c, i) => {
    const last = parts.at(-1);
    if (last && last.match === marked[i]) last.text += c;
    else parts.push({ text: c, match: marked[i] });
  });
  return parts;
}
