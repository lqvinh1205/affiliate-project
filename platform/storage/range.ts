// Header `Range` của GET file upload (RFC 9110 §14): chỉ nhận một khoảng byte — `bytes=a-b`, `bytes=a-`, `bytes=-n`.
// Safari trên iPhone cần trả 206 mới phát được video. Sai cú pháp hoặc nhiều khoảng → null (trả cả file 200, RFC cho
// phép bỏ qua Range); khoảng nằm ngoài file → "unsatisfiable" (416).
export function parseByteRange(header: string | null, size: number): { start: number; end: number } | "unsatisfiable" | null {
  const m = header?.trim().match(/^bytes=(\d*)-(\d*)$/i);
  if (!m || (!m[1] && !m[2])) return null;
  if (!m[1]) {
    const suffix = Number(m[2]);
    if (suffix === 0 || size === 0) return "unsatisfiable";
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : Infinity;
  if (!Number.isSafeInteger(start) || end < start) return null;
  if (start >= size) return "unsatisfiable";
  return { start, end: Math.min(end, size - 1) };
}
