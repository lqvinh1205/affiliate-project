import type { getContentSetForCms, listContentSetsForProductForCms } from "@/modules/content-sets/cms-queries";

export type { FacebookPayload } from "@/modules/content-sets/prompts/facebook-post.prompt";
export type { LinkCommentPayload } from "@/modules/content-sets/prompts/link-comment.prompt";
export type { ThreadsPayload } from "@/modules/content-sets/prompts/threads-post.prompt";

// Bộ nội dung như màn CMS đọc (ngày là chuỗi ISO).
export type ContentSetForCms = NonNullable<Awaited<ReturnType<typeof getContentSetForCms>>>;
export type SocialPostForCms = ContentSetForCms["socialPosts"][number];
export type ContentSetProductForCms = ContentSetForCms["products"][number];
export type ProductContentSetItem = Awaited<ReturnType<typeof listContentSetsForProductForCms>>[number];
