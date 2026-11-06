import "server-only";
import type { Platform } from "@/generated/prisma/enums";
import { db } from "@/platform/db";
import { STYLE_PLATFORM_KEYS, STYLE_PROFILE_DEFAULTS } from "@/modules/style-profiles/constants";

const select = {
  id: true,
  platform: true,
  voice: true,
  lengthMin: true,
  lengthMax: true,
  partsMin: true,
  partsMax: true,
  emoji: true,
  forbidden: true,
  rules: true,
  disclosure: true,
  updatedAt: true,
} as const;

// Hồ sơ phong cách như prompt và màn CMS dùng: bản ghi đã lưu, hoặc giá trị khởi tạo khi nền tảng chưa có bản ghi
// (`id` null — FR-18). Đọc không ghi (tạo lười khi Vinh lưu lần đầu).
function withDefaults(platform: Platform, row: Awaited<ReturnType<typeof findAll>>[number] | undefined) {
  if (row) return { ...row, updatedAt: row.updatedAt.toISOString() };
  return { id: null, platform, ...STYLE_PROFILE_DEFAULTS[platform], updatedAt: null };
}

function findAll() {
  return db.styleProfile.findMany({ select });
}

// Ba hồ sơ Website / Threads / Facebook theo thứ tự cố định (`/cms/phong-cach`).
export async function listStyleProfilesForCms() {
  const rows = await findAll();
  return STYLE_PLATFORM_KEYS.map((p) => withDefaults(p, rows.find((r) => r.platform === p)));
}

// Hồ sơ của một nền tảng lúc tạo nội dung (prompt đọc giá trị hiện tại — FR-18: sửa hồ sơ chỉ áp cho lần tạo sau).
export async function getStyleProfileForCms(platform: Platform) {
  const row = await db.styleProfile.findUnique({ where: { platform }, select });
  return withDefaults(platform, row ?? undefined);
}
