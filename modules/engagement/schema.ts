import { z } from "zod";

// Ghi một Lượt xem (FR-33): chỉ id Bài web, không nhận gì về người đọc (NFR-7).
export const recordPostViewInputSchema = z.object({ postId: z.uuid() });

export type RecordPostViewInput = z.infer<typeof recordPostViewInputSchema>;
