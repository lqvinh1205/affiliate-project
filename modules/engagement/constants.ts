// Lượt xem (FR-33, spine AD-23).

// Giới hạn tần suất ghi Lượt xem: tối đa 60 lần/phút từ cùng một nguồn (băm IP trong bộ nhớ tiến trình). Người đọc
// thật gửi tối đa một lần mỗi bài (chống trùng `localStorage`); mức này chừa chỗ cho nhiều người chung một IP (mạng
// di động NAT, wifi quán) mà vẫn chặn script dội.
export const VIEW_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

// Khoá `localStorage` (cùng origin cho site và CMS):
// - đã gửi Lượt xem bài `<postId>` từ trình duyệt này;
export const VIEWED_POST_KEY_PREFIX = "luot-xem:";
// - trình duyệt của Vinh (tự đánh dấu khi vào `/cms`) — không gửi Lượt xem.
export const OWNER_BROWSER_KEY = "trinh-duyet-cms";

export const RATE_LIMITED_ERROR = "Thao tác quá nhanh, thử lại sau";
export const INVALID_INPUT_ERROR = "Dữ liệu không hợp lệ";
