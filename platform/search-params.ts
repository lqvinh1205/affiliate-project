// Đọc tham số URL của màn danh sách CMS (`searchParams` của trang): một giá trị chuỗi và số trang `?trang`.

// `?x=a&x=b` → "a"; thiếu → "".
export function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

// `?trang`: số nguyên an toàn ≥ 1, còn lại về trang 1; vượt trang cuối do query kẹp lại.
export function pageParam(v: string) {
  const n = Number(v);
  return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}
