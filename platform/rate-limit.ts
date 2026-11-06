import { createHash, randomBytes } from "node:crypto";

// Giới hạn tần suất cho action công khai (spine AD-6, AD-23): đếm trong bộ nhớ tiến trình theo khoá là băm IP có
// muối ngẫu nhiên mỗi lần chạy, cửa sổ cố định ngắn; không ghi IP hay khoá xuống DB hay log (NFR-7, [QD-18]).
// Spine giả định một tiến trình (Deferred "nhiều instance").

const SALT = randomBytes(16).toString("hex");
// Quá ngưỡng này thì dọn các khoá đã hết cửa sổ (giữ bộ nhớ có trần khi bị dội nhiều IP).
const PRUNE_AT = 10_000;

// Khoá ẩn danh của nguồn gửi: băm IP (header của reverse proxy / Next), không đảo ngược được, đổi mỗi lần khởi động.
export function clientKey(headers: Headers) {
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(SALT).update(ip).digest("base64url").slice(0, 22);
}

export type RateLimiter = { hit: (key: string, now?: number) => boolean };

// `hit(key)` ghi một lần gọi; trả `false` khi khoá đã dùng hết `limit` lần trong cửa sổ `windowMs` hiện tại.
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();
  return {
    hit(key, now = Date.now()) {
      if (windows.size >= PRUNE_AT) {
        for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
      }
      const w = windows.get(key);
      if (!w || w.resetAt <= now) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (w.count >= limit) return false;
      w.count += 1;
      return true;
    },
  };
}
