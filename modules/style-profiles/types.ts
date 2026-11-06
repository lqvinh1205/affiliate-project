import type { getStyleProfileForCms } from "@/modules/style-profiles/cms-queries";

// Hồ sơ phong cách của một nền tảng như prompt và màn CMS đọc (`id` null = đang dùng giá trị khởi tạo).
export type StyleProfileView = Awaited<ReturnType<typeof getStyleProfileForCms>>;
