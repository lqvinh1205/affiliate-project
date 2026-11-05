import { requireAdmin } from "@/platform/auth/require-admin";
import { UNEXPECTED_ERROR, UserError, type Result } from "@/platform/errors";

// Bọc mọi Server Action của CMS: kiểm quyền, trả Result; lỗi bất ngờ chỉ ghi log phía server.
export async function run<T extends object>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    await requireAdmin();
    return { ok: true, ...(await fn()) };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: UNEXPECTED_ERROR };
  }
}
