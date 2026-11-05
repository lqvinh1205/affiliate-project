import Form from "next/form";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { formatShortDate } from "@/platform/format";
import { CMS_POST_PAGE_SIZE, POST_STATUS_FILTERS, type PostStatusFilter } from "@/modules/posts/constants";
import { listPostsForCms } from "@/modules/posts/cms-queries";
import type { CmsPostListItem } from "@/modules/posts/types";
import { PostStatusBadge } from "@/modules/posts/components/post-status-badge";
import { PostTypeBadge } from "@/modules/posts/components/post-type-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/lib/utils";

const LIST_PATH = "/cms/bai-viet";
const STATUS_PARAM = "trang-thai";

type Filters = { status: PostStatusFilter | null; q: string };

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function listHref({ status, q }: Filters, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set(STATUS_PARAM, status);
  if (q) params.set("q", q);
  if (page > 1) params.set("trang", String(page));
  const s = params.toString();
  return s ? `${LIST_PATH}?${s}` : LIST_PATH;
}

// `?trang`: số nguyên an toàn ≥ 1, còn lại về trang 1; vượt trang cuối do query kẹp lại.
function pageParam(v: string) {
  const n = Number(v);
  return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}

function statusParam(v: string): PostStatusFilter | null {
  return Object.hasOwn(POST_STATUS_FILTERS, v) ? (v as PostStatusFilter) : null;
}

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

const FILTER_TABS: { label: string; status: PostStatusFilter | null }[] = [
  { label: "Tất cả", status: null },
  { label: "Nháp", status: "nhap" },
  { label: "Đã xuất bản", status: "da-xuat-ban" },
];

function StatusFilter({ filters }: { filters: Filters }) {
  return (
    <nav aria-label="Lọc theo trạng thái">
      <ul className="flex gap-space-sm">
        {FILTER_TABS.map((t) => {
          const active = t.status === filters.status;
          return (
            <li key={t.label}>
              <Link
                href={listHref({ ...filters, status: t.status })}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-touch-target items-center rounded-full border px-space-md text-label-md ${
                  active ? "border-primary bg-primary-fixed text-on-primary-fixed" : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SearchForm({ filters }: { filters: Filters }) {
  return (
    <Form action={LIST_PATH} role="search" className="flex gap-2" key={filters.q}>
      {filters.status && <input type="hidden" name={STATUS_PARAM} value={filters.status} />}
      <label htmlFor="post-search" className="sr-only">
        Tìm Bài web theo tiêu đề
      </label>
      <Input id="post-search" type="search" name="q" defaultValue={filters.q} placeholder="Tìm theo tiêu đề" autoComplete="off" />
      <Button type="submit" variant="outline" size="lg">
        <Search aria-hidden /> Tìm
      </Button>
    </Form>
  );
}

function Pagination({ filters, page, pages }: { filters: Filters; page: number; pages: number }) {
  if (pages <= 1) return null;
  const link = (target: number, label: string, Icon: typeof ChevronLeft, after = false) => (
    <Link
      href={listHref(filters, target)}
      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-touch-target lg:min-h-0")}
    >
      {!after && <Icon aria-hidden />}
      {label}
      {after && <Icon aria-hidden />}
    </Link>
  );
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-2">
      {page > 1 ? link(page - 1, "Trang trước", ChevronLeft) : <span />}
      <span className="text-body-sm text-on-surface-variant">
        Trang {page}/{pages}
      </span>
      {page < pages ? link(page + 1, "Trang sau", ChevronRight, true) : <span />}
    </nav>
  );
}

// Meta một dòng: "Sửa dd/mm/yyyy · Danh mục · N Sản phẩm".
function meta(p: CmsPostListItem) {
  return [
    `Sửa ${formatShortDate(p.updatedAt)}`,
    p.category?.name ?? "Chưa có Danh mục",
    `${p._count.postProducts} Sản phẩm`,
  ].join(" · ");
}

// Danh sách Bài web (UX-DR39, UX-DR71): DataList (mobile Card, desktop Table), lọc Nháp / Đã xuất bản và tìm theo
// tiêu đề trên URL (`?trang-thai=`, `?q=`, `?trang=`), đọc qua `cms-queries` (AD-12). Xuất bản / chuyển về nháp /
// xoá ở màn sửa bài.
export async function PostListScreen({ searchParams }: Pick<PageProps<"/cms/bai-viet">, "searchParams">) {
  const params = await searchParams;
  const filters: Filters = { status: statusParam(first(params[STATUS_PARAM])), q: first(params.q).trim() };
  const { items, total, page } = await listPostsForCms({
    status: filters.status ? POST_STATUS_FILTERS[filters.status] : null,
    q: filters.q,
    page: pageParam(first(params.trang)),
  });
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
          <StatusFilter filters={filters} />
          <SearchForm filters={filters} />
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
                      <td className="py-2">
                        <PostStatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination filters={filters} page={page} pages={pages} />
            </>
          )}
        </>
      )}
    </div>
  );
}
