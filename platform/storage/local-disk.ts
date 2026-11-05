import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { UPLOADS_PATH } from "@/platform/images";
import { UPLOAD_TYPES, type UploadType } from "@/platform/upload-rules";

// Nơi lưu file upload (spine AD-24, Vinh 2026-11-05): đĩa cục bộ của máy chủ, thư mục `UPLOAD_DIR`,
// ngoài `public/` và thư mục build. Tên file = sha256 nội dung + đuôi theo loại: cùng file thì cùng URL,
// URL không đổi nội dung nên phục vụ được với cache `immutable`. Module chỉ lưu `url` trả về.

export class UploadTooLargeError extends Error {}
// Luồng không có byte nào: không lưu file 0 byte.
export class EmptyUploadError extends Error {}

// Thiếu `UPLOAD_DIR` hoặc trỏ vào `public/`, `.next/` → ném lỗi (fail closed), không lưu đâu khác.
export function uploadDir() {
  const raw = process.env.UPLOAD_DIR?.trim();
  if (!raw) throw new Error("Thiếu UPLOAD_DIR (xem .env.example)");
  const dir = path.resolve(/*turbopackIgnore: true*/ raw);
  for (const forbidden of ["public", ".next"]) {
    const rel = path.relative(path.resolve(/*turbopackIgnore: true*/ forbidden), dir);
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
      throw new Error(`UPLOAD_DIR không được nằm trong ${forbidden}/`);
    }
  }
  return dir;
}

const EXT_TYPES = new Map<string, UploadType>(
  Object.entries(UPLOAD_TYPES).map(([type, ext]) => [ext, type as UploadType]),
);
const STORED_NAME = new RegExp(`^[0-9a-f]{64}(${[...EXT_TYPES.keys()].map((e) => `\\${e}`).join("|")})$`);

// Ghi luồng `body` xuống đĩa, tính sha256 trong lúc ghi; vượt `maxBytes` thì huỷ, xoá file tạm, ném
// `UploadTooLargeError`; rỗng thì ném `EmptyUploadError`. Ghi vào file tạm rồi đổi tên: file chỉ xuất hiện khi đã đủ byte.
export async function put(
  file: { type: UploadType; body: ReadableStream<Uint8Array> },
  maxBytes: number,
): Promise<{ url: string }> {
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const tmp = path.join(/*turbopackIgnore: true*/ dir, `.tmp-${randomUUID()}`);
  const hash = createHash("sha256");
  let bytes = 0;
  const meter = new Transform({
    transform(chunk: Buffer, _enc, done) {
      bytes += chunk.length;
      if (bytes > maxBytes) return done(new UploadTooLargeError());
      hash.update(chunk);
      done(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(file.body as import("node:stream/web").ReadableStream), meter, createWriteStream(tmp));
    if (bytes === 0) throw new EmptyUploadError();
    const name = `${hash.digest("hex")}${UPLOAD_TYPES[file.type]}`;
    await rename(tmp, path.join(/*turbopackIgnore: true*/ dir, name));
    return { url: `${UPLOADS_PATH}${name}` };
  } catch (e) {
    await rm(tmp, { force: true });
    throw e;
  }
}

// Mở file đã lưu theo tên (một đoạn đường dẫn); tên không đúng dạng hash + đuôi (kể cả `..`) → null.
export async function openStoredFile(name: string) {
  const type = EXT_TYPES.get(path.extname(name));
  if (!STORED_NAME.test(name) || !type) return null;
  const file = path.join(/*turbopackIgnore: true*/ uploadDir(), name);
  try {
    const { size } = await stat(file);
    return { size, type, stream: Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array> };
  } catch {
    return null;
  }
}
