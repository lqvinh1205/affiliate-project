import { notFound, permanentRedirect } from "next/navigation";
import { getPostBySlug, getPostSlugRedirect } from "@/modules/posts/queries";

// Tra Bài web theo slug ở cấp `page.tsx`, trước `<Suspense>` (AD-12): không thấy thì tra lịch sử đổi slug và trả 308
// sang slug hiện tại (AD-20, FR-27); không có lịch sử → 404.
export async function loadPost(slug: string) {
  const post = await getPostBySlug(slug);
  if (post) return post;
  const current = await getPostSlugRedirect(slug);
  if (current) permanentRedirect(`/bai-viet/${current}`);
  notFound();
}
