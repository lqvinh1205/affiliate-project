import "server-only";
import { db } from "@/platform/db";
import { uploadedMediaKind } from "@/platform/upload-rules";
import { VIDEO_LINK_HOSTS } from "@/modules/inspirations/constants";

// Link thuộc host video (FR-2): AI nhận link như video (`ask({ videoUrl })`).
function isVideoLink(url: string) {
  try {
    const { hostname } = new URL(url);
    const host = hostname.toLowerCase().replace(/^www\./, "");
    return VIDEO_LINK_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

// Tên ngắn của Cảm hứng cho dải "Từ Cảm hứng: …" và danh sách: ghi chú, không có thì host của link, rồi loại file.
export function inspirationLabel(i: { note: string | null; url: string | null; mediaUrl: string | null }) {
  if (i.note) return i.note;
  if (i.url) {
    try {
      return new URL(i.url).hostname.replace(/^www\./, "");
    } catch {
      return i.url;
    }
  }
  return uploadedMediaKind(i.mediaUrl ?? "") === "video" ? "Video tải lên" : "Ảnh tải lên";
}

// Một Cảm hứng (Chi tiết, dải "Từ Cảm hứng" ở màn Sản phẩm, action Nghiên cứu). Trạng thái là trạng thái **lưu**:
// *Đã dùng* do màn ghép với Bộ nội dung (`content-sets`, tầng cao hơn — AD-2). Ngày ISO (AD-8).
export async function getInspirationForCms(id: string) {
  const row = await db.inspiration.findUnique({
    where: { id },
    select: { id: true, url: true, mediaUrl: true, note: true, status: true, createdAt: true },
  });
  if (!row) return null;
  return {
    ...row,
    label: inspirationLabel(row),
    mediaKind: row.mediaUrl ? uploadedMediaKind(row.mediaUrl) : null,
    videoLink: !!row.url && isVideoLink(row.url),
    createdAt: row.createdAt.toISOString(),
  };
}
