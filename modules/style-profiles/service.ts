import "server-only";
import { db } from "@/platform/db";
import type { StyleProfileInput } from "@/modules/style-profiles/schema";

// Lưu Hồ sơ phong cách (FR-18): upsert theo nền tảng — lần lưu đầu tạo bản ghi. Nội dung đã tạo không đổi: gợi ý
// và bài đã Duyệt giữ chữ của chúng, prompt chỉ đọc hồ sơ lúc tạo.
export async function saveStyleProfileRecord(data: StyleProfileInput) {
  const { platform, ...fields } = data;
  return db.styleProfile.upsert({
    where: { platform },
    create: { platform, ...fields },
    update: fields,
    select: { id: true, platform: true },
  });
}
