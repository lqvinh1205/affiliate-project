// Lượt xem, Lượt tim (FR-33, FR-35, spine AD-23).

// Giới hạn tần suất ghi Lượt xem: tối đa 60 lần/phút từ cùng một nguồn (băm IP trong bộ nhớ tiến trình). Người đọc
// thật gửi tối đa một lần mỗi bài (chống trùng `localStorage`); mức này chừa chỗ cho nhiều người chung một IP (mạng
// di động NAT, wifi quán) mà vẫn chặn script dội.
export const VIEW_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

// Khoá `localStorage` (cùng origin cho site và CMS):
// - đã gửi Lượt xem bài `<postId>` từ trình duyệt này;
export const VIEWED_POST_KEY_PREFIX = "luot-xem:";
// - trình duyệt của Vinh (tự đánh dấu khi vào `/cms`) — không gửi Lượt xem.
export const OWNER_BROWSER_KEY = "trinh-duyet-cms";
// - đã thả tim bài `<postId>` từ trình duyệt này (FR-35: mỗi trình duyệt một tim mỗi bài).
export const LIKED_POST_KEY_PREFIX = "tim:";

// Giới hạn tần suất thả / bỏ tim: tối đa 30 lần/phút từ cùng một nguồn (FR-35).
export const LIKE_RATE_LIMIT = { limit: 30, windowMs: 60_000 };
// Giới hạn tần suất đọc số tim (mỗi lần mở trang bài đọc một lần): 120 lần/phút mỗi nguồn — rộng hơn ghi vì nhiều
// người đọc chung một IP (NAT) cùng mở bài; vẫn chặn script dội.
export const LIKE_COUNT_RATE_LIMIT = { limit: 120, windowMs: 60_000 };

// Bài không còn trên site (nháp / đã xoá) khi thả tim.
export const POST_GONE_ERROR = "Bài này không còn trên trang";

// "Xem nhiều" (FR-34): cửa sổ Lượt xem 30 ngày gần nhất; Trang chủ hiện tối đa 5 bài, trang 404 lấy 3 bài đầu.
export const POPULAR_DAYS = 30;
export const POPULAR_POSTS_LIMIT = 5;
export const POPULAR_POSTS_NOT_FOUND = 3;
