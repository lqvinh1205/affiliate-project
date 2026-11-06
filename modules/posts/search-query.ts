import { searchTerms } from "@/platform/search-text";
import { SEARCH_QUERY_MAX, SEARCH_QUERY_MIN, SEARCH_TERMS_MAX } from "@/modules/posts/constants";

// Luật từ khoá tìm kiếm (FR-36, UX-DR31) — một chỗ cho cả `searchPostsInputSchema` (server) và `PostSearch` (client),
// để client không gửi từ khoá server chắc chắn từ chối. Tối đa `SEARCH_QUERY_MAX` ký tự; sau khi gấp không dấu còn ít
// nhất `SEARCH_QUERY_MIN` ký tự (vd "C++", "a!", "🍳" không đủ); tối đa `SEARCH_TERMS_MAX` từ (từ thừa bị bỏ).
// Trả về các từ đã gấp, hoặc null khi chưa tìm được.
export function searchQueryTerms(q: string): string[] | null {
  if (q.length > SEARCH_QUERY_MAX) return null;
  const terms = searchTerms(q).slice(0, SEARCH_TERMS_MAX);
  return terms.join(" ").length >= SEARCH_QUERY_MIN ? terms : null;
}
