// Biểu thức tìm một câu, bỏ khác biệt khoảng trắng (dùng chung cho ô chữ và PostEditor). Câu rỗng → null.
export function sentencePattern(sentence: string) {
  const needle = sentence.trim();
  if (!needle) return null;
  return new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"));
}

// Tìm câu trong ô nhập chữ rồi chọn (bôi) và cuộn tới nó — dùng cho RiskWarning (UX-DR43: chạm mục cuộn và highlight
// câu). Không thấy (Vinh đã sửa câu) trả `false`.
export function selectSentence(el: HTMLTextAreaElement | HTMLInputElement, sentence: string) {
  const m = sentencePattern(sentence)?.exec(el.value);
  if (!m) return false;
  const start = m.index;
  const end = start + m[0].length;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
  el.focus({ preventScroll: true });
  el.setSelectionRange(start, end);
  return true;
}
