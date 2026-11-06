// Luật upload dùng chung cho route `app/cms/upload/route.ts` (server) và UploadField (client) — AD-24.
// Không `server-only`: client kiểm trước để báo lỗi tại trường mà không phải gửi file.

export const UPLOAD_ENDPOINT = "/cms/upload";

const MB = 1024 * 1024;
// Ảnh điện thoại có thể > 10 MB (giới hạn đệm của proxy) — route nằm ngoài proxy nên nhận nguyên vẹn.
export const IMAGE_MAX_BYTES = 25 * MB;
export const VIDEO_MAX_BYTES = 100 * MB;

// Loại file nhận → đuôi file lưu. Đuôi lấy theo loại, không theo tên file người dùng.
export const UPLOAD_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
} as const;

export type UploadType = keyof typeof UPLOAD_TYPES;
export type UploadKind = "image" | "media";

export function isUploadType(type: string): type is UploadType {
  return Object.hasOwn(UPLOAD_TYPES, type);
}

const isVideo = (type: string) => type.startsWith("video/");

export function maxUploadBytes(type: UploadType) {
  return isVideo(type) ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
}

// Thuộc tính `accept` của `<input type="file">` theo loại trường.
export function acceptAttribute(kind: UploadKind) {
  return Object.keys(UPLOAD_TYPES)
    .filter((t) => kind === "media" || !isVideo(t))
    .join(",");
}

// Lỗi tiếng Việt cho trường upload, hoặc null nếu hợp lệ. `size` null khi chưa biết (route đọc dạng luồng).
export function uploadError(type: string, size: number | null, kind: UploadKind = "media"): string | null {
  if (!isUploadType(type) || (kind === "image" && isVideo(type))) {
    return kind === "image"
      ? "Chỉ nhận ảnh JPG, PNG, WebP, GIF hoặc AVIF"
      : "Chỉ nhận ảnh JPG, PNG, WebP, GIF, AVIF hoặc video MP4, WebM, MOV";
  }
  if (size === null) return null;
  if (size === 0) return "File rỗng, chọn file khác";
  if (size > maxUploadBytes(type)) {
    return isVideo(type) ? `Video tối đa ${VIDEO_MAX_BYTES / MB} MB` : `Ảnh tối đa ${IMAGE_MAX_BYTES / MB} MB`;
  }
  return null;
}

// File đã tải lên qua route upload (`platform/storage` trả `/uploads/<sha256>.<đuôi>`): loại theo đuôi, hoặc null khi
// không phải đường dẫn file upload (link ngoài, đường dẫn lạ). Module lưu `url` này (vd Cảm hứng — FR-1) dùng để
// validate và chọn cách hiển thị.
const UPLOADED_FILE = new RegExp(
  `^/uploads/[0-9a-f]{64}(${Object.values(UPLOAD_TYPES)
    .map((e) => `\\${e}`)
    .join("|")})$`,
);

export function uploadedMediaKind(url: string): "image" | "video" | null {
  const m = UPLOADED_FILE.exec(url);
  if (!m) return null;
  const type = Object.entries(UPLOAD_TYPES).find(([, ext]) => ext === m[1])?.[0] ?? "";
  return isVideo(type) ? "video" : "image";
}
