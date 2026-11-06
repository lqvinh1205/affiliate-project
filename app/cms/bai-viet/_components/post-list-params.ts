import { POST_STATUS_FILTERS, type PostStatusFilter } from "@/modules/posts/constants";
import type { PostStatSort } from "@/modules/engagement/cms-queries";

// Tham số URL của danh sách Bài web CMS (`/cms/bai-viet?trang-thai=…&q=…&sap-xep=…&trang=…`).
export const LIST_PATH = "/cms/bai-viet";
export const STATUS_PARAM = "trang-thai";
export const SORT_PARAM = "sap-xep";
// Sắp xếp: mặc định (không có tham số) = sửa gần nhất; `luot-xem` = Lượt xem nhiều nhất, `luot-tim` = Lượt tim nhiều
// nhất (FR-38).
export const SORT_VALUES = { "luot-xem": "views", "luot-tim": "likes" } as const satisfies Record<string, PostStatSort>;
type SortValue = keyof typeof SORT_VALUES;

export type PostListFilters = { status: PostStatusFilter | null; q: string; sort: SortValue | null };

export function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function listHref({ status, q, sort }: PostListFilters, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set(STATUS_PARAM, status);
  if (q) params.set("q", q);
  if (sort) params.set(SORT_PARAM, sort);
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

export function sortParam(v: string): SortValue | null {
  return Object.hasOwn(SORT_VALUES, v) ? (v as SortValue) : null;
}
