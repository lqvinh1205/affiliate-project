import { BASIC_AUTH_CHALLENGE } from "@/platform/auth/basic-auth";
import { requireAdmin } from "@/platform/auth/require-admin";
import { UNEXPECTED_ERROR } from "@/platform/errors";
import { EmptyUploadError, put, UploadTooLargeError } from "@/platform/storage/local-disk";
import { isUploadType, maxUploadBytes, uploadError } from "@/platform/upload-rules";

// Upload file của CMS (spine AD-6 ngoại lệ 3, AD-24). Nằm ngoài matcher `proxy.ts` (proxy chỉ đệm 10 MB)
// nên tự kiểm quyền trước khi đọc body. Body là nội dung file thô, `Content-Type` = loại file; ghi dạng luồng.
// Trả `{ ok: true, url }` hoặc `{ ok: false, error }` (tiếng Việt, hiện tại trường).

const EMPTY = "File rỗng, chọn file khác";

function fail(status: number, error: string) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Cần đăng nhập", { status: 401, headers: { "WWW-Authenticate": BASIC_AUTH_CHALLENGE } });
  }

  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!isUploadType(type)) return fail(415, uploadError(type, null) ?? UNEXPECTED_ERROR);
  const length = request.headers.get("content-length");
  const size = length === null ? null : Number(length);
  if (size === 0 || !request.body) return fail(400, EMPTY);
  const tooLarge = uploadError(type, size);
  if (tooLarge) return fail(413, tooLarge);

  try {
    return Response.json({ ok: true, ...(await put({ type, body: request.body }, maxUploadBytes(type))) });
  } catch (e) {
    // Content-Length có thể vắng hoặc sai: giới hạn và file rỗng vẫn kiểm trong lúc ghi.
    if (e instanceof UploadTooLargeError) return fail(413, uploadError(type, Infinity) ?? UNEXPECTED_ERROR);
    if (e instanceof EmptyUploadError) return fail(400, EMPTY);
    return fail(500, UNEXPECTED_ERROR);
  }
}
