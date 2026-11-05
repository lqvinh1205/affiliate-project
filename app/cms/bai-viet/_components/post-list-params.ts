import { POST_STATUS_FILTERS, type PostStatusFilter } from "@/modules/posts/constants";

// Tham số URL của danh sách Bài web CMS (`/cms/bai-viet?trang-thai=…&q=…&trang=…`).
export const LIST_PATH = "/cms/bai-viet";
export const STATUS_PARAM = "trang-thai";

export type PostListFilters = { status: PostStatusFilter | null; q: string };

export function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function listHref({ status, q }: PostListFilters, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set(STATUS_PARAM, status);
  if (q) params.set("q", q);
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
