import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/platform/db";
import { vietnamDay } from "@/platform/format";
import { postCardSelect, publishedPostWhere, toPostCard } from "@/modules/posts/queries";
import { POSTS_TAG } from "@/modules/posts/tags";
import { PRODUCTS_TAG } from "@/modules/products/tags";
import { POPULAR_DAYS } from "@/modules/engagement/constants";
import { ENGAGEMENT_TAG } from "@/modules/engagement/tags";

// Query public của `engagement` (spine AD-7, AD-23).

// "Xem nhiều" (FR-34): tối đa `limit` Bài web đã xuất bản nhiều Lượt xem nhất trong `POPULAR_DAYS` ngày gần nhất (tính
// cả hôm nay, theo ngày Việt Nam), nhiều nhất trước (bằng nhau thì theo id cho thứ tự ổn định). Bài không có lượt xem
// trong cửa sổ không vào danh sách. Chạm `PostViewDaily` + `Post` → đặt ở `engagement` (AD-2); cột thẻ bài và ảnh
// fallback (Sản phẩm đang hiện) lấy từ `posts/queries` nên gắn cả tag `posts`, `products`.
// `cacheLife("days")` cố định: không `updateTag` mỗi lượt xem (AD-23), danh sách làm mới tối đa mỗi ngày (cửa sổ 30
// ngày nên trễ một ngày không đổi nhiều). Không dùng hồ sơ ngắn hơn: trang 404 nằm trong cây của mọi route, hồ sơ
// "hours" ở đây kéo cả site tạo lại mỗi giờ. Thời điểm hiện tại lấy bên trong hàm cache (như Banner theo lịch — AD-7),
// không nhận làm tham số.
export async function getPopularPosts(limit: number) {
  "use cache";
  cacheLife("days");
  cacheTag(ENGAGEMENT_TAG, POSTS_TAG, PRODUCTS_TAG);
  const since = vietnamDay(new Date(Date.now() - (POPULAR_DAYS - 1) * 86_400_000));
  const ranked = await db.postViewDaily.groupBy({
    by: ["postId"],
    where: { day: { gte: since }, views: { gt: 0 }, post: publishedPostWhere },
    _sum: { views: true },
    orderBy: [{ _sum: { views: "desc" } }, { postId: "asc" }],
    take: limit,
  });
  if (ranked.length === 0) return [];
  const rows = await db.post.findMany({
    where: { ...publishedPostWhere, id: { in: ranked.map((r) => r.postId) } },
    select: { id: true, ...postCardSelect },
  });
  const byId = new Map(rows.map(({ id, ...row }) => [id, toPostCard(row)]));
  return ranked.flatMap((r) => byId.get(r.postId) ?? []);
}
