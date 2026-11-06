import { z } from "zod";

// Ghi một Lượt xem (FR-33): chỉ id Bài web, không nhận gì về người đọc (NFR-7).
export const recordPostViewInputSchema = z.object({ postId: z.uuid() });

// Đọc số Lượt tim của một bài (FR-35).
export const getPostLikesInputSchema = z.object({ postId: z.uuid() });

// Thả tim (`liked: true`) hoặc bỏ tim (`liked: false`) một bài (FR-35). Trạng thái "đã thả" nằm ở trình duyệt.
export const setPostLikeInputSchema = z.object({ postId: z.uuid(), liked: z.boolean() });

export type RecordPostViewInput = z.infer<typeof recordPostViewInputSchema>;
