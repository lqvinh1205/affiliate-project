import type { Result } from "@/platform/errors";

export const NETWORK_ERROR = "Chưa gửi được, kiểm tra mạng rồi thử lại";

// Gọi Server Action từ client: lỗi mạng (hoặc Basic Auth hỏi lại) thành Result lỗi tiếng Việt.
export async function callAction<T extends object>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await fn();
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}
