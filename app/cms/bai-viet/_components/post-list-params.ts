import { POST_STATUS_FILTERS, type PostStatusFilter } from "@/modules/posts/constants";

// Tham số URL của danh sách Bài web CMS (`/cms/bai-viet?trang-thai=…&q=…&sap-xep=…&trang=…`).
export const LIST_PATH = "/cms/bai-viet";
export const STATUS_PARAM = "trang-thai";
export const SORT_PARAM = "sap-xep";
// Sắp xếp: mặc định (không có tham số) = sửa gần nhất; `luot-xem` = Lượt xem nhiều nhất (FR-38).
export const SORT_BY_VIEWS = "luot-xem";

export type PostListFilters = { status: PostStatusFilter | null; q: string; byViews: boolean };

export function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function listHref({ status, q, byViews }: PostListFilters, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set(STATUS_PARAM, status);
  if (q) params.set("q", q);
  if (byViews) params.set(SORT_PARAM, SORT_BY_VIEWS);
  if (page > 1) params.set("trang", String(page));
  const s = params.toString();
  return s ? `${LIST_PATH}?${s}` : LIST_PATH;
}

// `?trang`: số nguyên an toàn ≥ 1, còn lại về trang 1; vượt trang cuối do query kẹp lại.
export function pageParam(v: string) {
  const n = Number(v);
  return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}

export function statusParam(v: string): PostStatusFilter | null {
  return Object.hasOwn(POST_STATUS_FILTERS, v) ? (v as PostStatusFilter) : null;
}
