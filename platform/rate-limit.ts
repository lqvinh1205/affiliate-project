import { createHash, randomBytes } from "node:crypto";

// Giới hạn tần suất cho action công khai (spine AD-6, AD-23): đếm trong bộ nhớ tiến trình theo khoá là băm IP có
// muối ngẫu nhiên mỗi lần chạy, cửa sổ cố định ngắn; không ghi IP hay khoá xuống DB hay log (NFR-7, [QD-18]).
// Spine giả định một tiến trình (Deferred "nhiều instance").

const SALT = randomBytes(16).toString("hex");
// Trần số khoá đang theo dõi: đầy thì bỏ khoá cũ nhất (giữ bộ nhớ và thời gian mỗi lần gọi có trần khi bị dội
// nhiều IP).
export const MAX_KEYS = 10_000;

// Khoá ẩn danh của nguồn gửi: băm IP, không đảo ngược được, đổi mỗi lần khởi động. IP lấy ở mục CUỐI của
// `x-forwarded-for`: reverse proxy (một tầng, vd nginx `$proxy_add_x_forwarded_for`) nối IP thật vào cuối, còn
// các mục phía trước do client tự gửi nên giả được; chạy `next start` không proxy thì Next tự điền IP socket khi
// thiếu header. Không đọc `x-real-ip` (client tự đặt được nếu proxy không ghi đè).
export function clientKey(headers: Headers) {
  const ip = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  return createHash("sha256").update(SALT).update(ip).digest("base64url").slice(0, 22);
}

export type RateLimiter = { hit: (key: string, now?: number) => boolean };

// `hit(key)` ghi một lần gọi; trả `false` khi khoá đã dùng hết `limit` lần trong cửa sổ `windowMs` hiện tại.
export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = MAX_KEYS,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  // Map giữ thứ tự chèn: khoá mở cửa sổ mới được chèn lại nên khoá đầu Map là khoá cũ nhất.
  const windows = new Map<string, { count: number; resetAt: number }>();
  let nextPruneAt = 0;
  return {
    hit(key, now = Date.now()) {
      // Dọn khoá hết cửa sổ tối đa một lần mỗi cửa sổ (không quét cả Map ở mọi lần gọi).
      if (now >= nextPruneAt) {
        for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
        nextPruneAt = now + windowMs;
      }
      const w = windows.get(key);
      if (!w || w.resetAt <= now) {
        windows.delete(key);
        if (windows.size >= maxKeys) windows.delete(windows.keys().next().value!);
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (w.count >= limit) return false;
      w.count += 1;
      return true;
    },
  };
}
