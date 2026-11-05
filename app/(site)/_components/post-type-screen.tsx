import type { PostType } from "@/generated/prisma/enums";
import { POST_TYPES } from "@/modules/posts/constants";
import { listPostsByType } from "@/modules/posts/queries";
import type { PostListPage } from "@/modules/posts/types";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { PostListScreen } from "@/app/(site)/_components/post-list-screen";

// Màn trang Loại bài. Trang gốc tự đọc trang 1; trang `/trang/[n]` nhận `data` đã tra ở `page.tsx` (AD-12).
export async function PostTypeScreen({ postType, page, data }: { postType: PostType; page: number; data?: PostListPage }) {
  const { label, slug, description } = POST_TYPES[postType];
  return (
    <PostListScreen
      title={label}
      description={description}
      badge={<PostTypeBadge postType={postType} />}
      base={`/${slug}`}
      page={page}
      data={data ?? (await listPostsByType(postType, page))}
      emptyTitle={`Chưa có bài ${label} nào`}
    />
  );
}
