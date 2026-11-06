// Lỗi được phép hiện nguyên văn cho người dùng (tiếng Việt). Lỗi khác bị thay bằng thông báo chung.
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export const UNEXPECTED_ERROR = "Có lỗi xảy ra, thử lại sau";

// Lỗi chung của action công khai (spine AD-6 — `engagement`, `posts.searchPosts`).
export const INVALID_INPUT_ERROR = "Dữ liệu không hợp lệ";
export const RATE_LIMITED_ERROR = "Thao tác quá nhanh, thử lại sau";
