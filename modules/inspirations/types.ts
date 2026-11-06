import type { getInspirationForCms } from "@/modules/inspirations/cms-queries";

// Một Cảm hứng như màn CMS đọc (trạng thái lưu; *Đã dùng* do màn ghép).
export type InspirationForCms = NonNullable<Awaited<ReturnType<typeof getInspirationForCms>>>;
