import Link from "next/link";
import { Plus } from "lucide-react";
import { formatCount, formatShortDate } from "@/platform/format";
import { CMS_POST_PAGE_SIZE, POST_STATUS_FILTERS } from "@/modules/posts/constants";
import { listPostsForCms } from "@/modules/posts/cms-queries";
import { PostStatusBadge } from "@/modules/posts/components/post-status-badge";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { getPostViewsForCms, listPostsByViewsForCms } from "@/modules/engagement/cms-queries";
import type { CmsPostWithViews } from "@/modules/engagement/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";
import {
  first,
  LIST_PATH,
  pageParam,
  SORT_BY_VIEWS,
  SORT_PARAM,
  STATUS_PARAM,
  statusParam,
  type PostListFilters,
} from "@/app/cms/bai-viet/_components/post-list-params";
import { PostListPagination } from "@/app/cms/bai-viet/_components/post-list-pagination";
import { PostSearchForm } from "@/app/cms/bai-viet/_components/post-search-form";
import { PostSortTabs } from "@/app/cms/bai-viet/_components/post-sort-tabs";
import { PostStatusTabs } from "@/app/cms/bai-viet/_components/post-status-tabs";

function CreateLink() {
  return (
    <Link
      href={`${LIST_PATH}/moi`}
      className={cn(buttonVariants({ size: "lg" }), "min-h-touch-target w-full lg:min-h-0 lg:w-auto")}
    >
      <Plus aria-hidden /> Tạo Bài web
    </Link>
  );
}

// Meta một dòng: "Sửa dd/mm/yyyy · Danh mục · N Sản phẩm · N lượt xem".
function meta(p: CmsPostWithViews) {
  return [
    `Sửa ${formatShortDate(p.updatedAt)}`,
    p.category?.name ?? "Chưa có Danh mục",
    `${p._count.postProducts} Sản phẩm`,
    `${formatCount(p.views)}\u00a0lượt\u00a0xem`,
  ].join(" · ");
}

// Một trang danh sách kèm Lượt xem (FR-38). Sắp theo Lượt xem: query của `engagement` (AD-2); mặc định: danh sách
// của `posts` rồi ghép Lượt xem của các bài trên trang.
async function loadPage(filters: PostListFilters, page: number) {
  const query = { status: filters.status ? POST_STATUS_FILTERS[filters.status] : null, q: filters.q, page };
  if (filters.byViews) return listPostsByViewsForCms(query);
  const list = await listPostsForCms(query);
  const views = await getPostViewsForCms(list.items.map((p) => p.id));
  return { ...list, items: list.items.map((p) => ({ ...p, views: views[p.id] ?? 0 })) };
}

// Danh sách Bài web (UX-DR39, UX-DR71): DataList (mobile Card, desktop Table), lọc Nháp / Đã xuất bản, tìm theo
// tiêu đề và sắp xếp (sửa gần nhất / Lượt xem) trên URL (`?trang-thai=`, `?q=`, `?sap-xep=`, `?trang=`), đọc qua
// `cms-queries` (AD-12). Xuất bản / chuyển về nháp / xoá ở màn sửa bài.
export async function PostListScreen({ searchParams }: Pick<PageProps<"/cms/bai-viet">, "searchParams">) {
  const params = await searchParams;
  const filters: PostListFilters = {
    status: statusParam(first(params[STATUS_PARAM])),
    q: first(params.q).trim(),
    byViews: first(params[SORT_PARAM]) === SORT_BY_VIEWS,
  };
  const { items, total, page } = await loadPage(filters, pageParam(first(params.trang)));
  const pages = Math.ceil(total / CMS_POST_PAGE_SIZE);
  const filtered = Boolean(filters.status || filters.q);

  return (
    <div className="flex flex-col gap-space-md">
      <h1 className="text-headline-lg-mobile lg:text-headline-lg">Bài web</h1>
      {total === 0 && !filtered ? (
        <div className="space-y-space-md rounded-xl border p-space-lg text-center">
          <p className="text-on-surface-variant">Chưa có Bài web nào. Tạo Bài web đầu tiên.</p>
          <CreateLink />
        </div>
      ) : (
        <>
          {/* Mobile: nút tạo dính đáy (sau danh sách); desktop: ngay dưới tiêu đề. */}
          <div className="sticky-bar sticky bottom-0 z-20 order-last -mx-margin border-t px-margin pt-space-sm pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-sticky-bottom lg:static lg:order-none lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <CreateLink />
          </div>
          <PostStatusTabs filters={filters} />
          <PostSearchForm filters={filters} />
          <PostSortTabs filters={filters} />
          {items.length === 0 ? (
            <div className="space-y-space-md rounded-xl border p-space-lg text-center">
              <p className="text-on-surface-variant">Không có kết quả với bộ lọc này</p>
              <Link href={LIST_PATH} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-touch-target lg:min-h-0")}>
                Xoá bộ lọc
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-space-sm lg:hidden">
                {items.map((p) => (
                  <li key={p.id}>
                    <Link href={`${LIST_PATH}/${p.id}`} className="block space-y-1 rounded-xl border bg-card p-space-md hover:bg-surface-container-low">
                      <span className="flex items-start justify-between gap-space-sm">
                        <span className="min-w-0 text-headline-sm">{p.title}</span>
                        <PostStatusBadge status={p.status} />
                      </span>
                      <span className="flex flex-wrap items-center gap-space-sm text-body-sm text-on-surface-variant">
                        <PostTypeBadge postType={p.postType} />
                        {meta(p)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <table className="hidden w-full text-left text-body-sm lg:table">
                <thead className="text-on-surface-variant">
                  <tr className="border-b">
                    <th scope="col" className="py-2 pr-4 font-medium">Tiêu đề</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Loại bài</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Danh mục</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Sản phẩm</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Sửa lần cuối</th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">Lượt xem</th>
                    <th scope="col" className="py-2 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-semibold">
                        <Link href={`${LIST_PATH}/${p.id}`} className="hover:underline">
                          {p.title}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        <PostTypeBadge postType={p.postType} />
                      </td>
                      <td className="py-2 pr-4 text-on-surface-variant">{p.category?.name ?? "—"}</td>
                      <td className="py-2 pr-4 text-on-surface-variant">{p._count.postProducts}</td>
                      <td className="py-2 pr-4 text-on-surface-variant">{formatShortDate(p.updatedAt)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatCount(p.views)}</td>
                      <td className="py-2">
                        <PostStatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PostListPagination filters={filters} page={page} pages={pages} />
            </>
          )}
        </>
      )}
    </div>
  );
}
