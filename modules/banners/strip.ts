// Thẻ coi là "đang thấy" khi ≥ 60% thẻ nằm trong khung dải (UX-DR85).
export const VISIBLE_SLIDE_RATIO = 0.6;

// Chấm vị trí của BannerStrip: trong một lượt báo của IntersectionObserver, chọn thẻ thấy nhiều nhất trong các thẻ đạt
// ngưỡng; không thẻ nào đạt thì giữ chấm hiện tại (null). Không dùng `isIntersecting`: nó đúng cả khi chỉ lộ một mép
// thẻ (thẻ sau ló ra ở 360px, thẻ đang rời khung khi nhảy lùi).
export function visibleSlideIndex(entries: { index: number; ratio: number }[]): number | null {
  let best: { index: number; ratio: number } | null = null;
  for (const e of entries) {
    if (e.ratio >= VISIBLE_SLIDE_RATIO && (!best || e.ratio > best.ratio)) best = e;
  }
  return best?.index ?? null;
}
