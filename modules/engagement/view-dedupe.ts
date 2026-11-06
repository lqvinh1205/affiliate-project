// Luật chống trùng Lượt xem phía client (FR-33, AD-23) — hàm thuần để test; `PostViewTracker` chỉ gọi.

// Cờ đọc từ `localStorage`: chuỗi/`null` khi đọc được, `undefined` khi `localStorage` bị chặn.
type StoredFlag = string | null | undefined;

// Gửi khi đọc được `localStorage`, trình duyệt không phải của Vinh (chưa vào `/cms`) và chưa gửi bài này.
// `localStorage` bị chặn → không gửi (không chống trùng được; thà thiếu hơn đếm trùng).
export function shouldSendView(owner: StoredFlag, seen: StoredFlag) {
  return owner === null && seen === null;
}

// Đánh dấu đã gửi chỉ khi server nhận (kể cả `counted: false` — bot/bài không có); bị giới hạn tần suất hay lỗi thì
// không đánh dấu để lần mở sau gửi lại.
export function shouldMarkViewed(res: { ok: boolean }) {
  return res.ok;
}
