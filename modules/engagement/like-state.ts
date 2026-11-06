import { formatCount } from "@/platform/format";

// Luật hiển thị LikeButton (FR-35, UX-DR25) — hàm thuần để test; `PostLikeProvider`/`LikeButton` chỉ gọi.

// Số tim sau khi thả (`liked` = true) hoặc bỏ tim; chưa có số (null — chưa tải / lỗi) thì vẫn chưa có; không âm.
export function nextLikeCount(count: number | null, liked: boolean) {
  return count === null ? null : Math.max(0, count + (liked ? 1 : -1));
}

// Số tim khi hoàn lại sau một lần gửi lỗi: về đúng số trước lúc chạm (`before`), không trừ ngược (+1 rồi −1 không
// đối xứng khi số bị kẹp ở 0). Lúc chạm chưa có số (`before` null) thì giữ số hiện tại — có thể là số server vừa tải
// về trong lúc chờ, chưa cộng optimistic.
export function revertedLikeCount(before: number | null, current: number | null) {
  return before ?? current;
}

// Nhãn đọc của LikeButton có số (UX-DR89): "Đã thả tim, 342 lượt" / "Thả tim bài viết, 342 lượt"; chưa có số thì
// bỏ phần số.
export function likeLabel(liked: boolean, count: number | null) {
  const action = liked ? "Đã thả tim" : "Thả tim bài viết";
  return count === null ? action : `${action}, ${formatCount(count)} lượt`;
}
