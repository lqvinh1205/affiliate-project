import Form from "next/form";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { formatShortDate } from "@/platform/format";
import { PRODUCT_PAGE_SIZE } from "@/modules/products/constants";
import { listProductsForCms } from "@/modules/products/cms-queries";
import { ProductStatusBadge } from "@/modules/products/components/product-status-badge";
import type { ProductListItem } from "@/modules/products/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/lib/utils";

const LIST_PATH = "/cms/san-pham";

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function pageHref(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("trang", String(page));
  const s = params.toString();
  return s ? `${LIST_PATH}?${s}` : LIST_PATH;
}

function CreateLink() {
  return (
    <Link
      href={`${LIST_PATH}/moi`}
      className={cn(buttonVariants({ size: "lg" }), "min-h-touch-target w-full lg:min-h-0 lg:w-auto")}
    >
      <Plus aria-hidden /> Tạo Sản phẩm
    </Link>
  );
}

// Meta một dòng: "Giá tham khảo ~89.000đ · cập nhật dd/mm/yyyy · Danh mục".
function meta(p: ProductListItem) {
  const parts = [];
  if (p.priceText) {
    const date = formatShortDate(p.priceUpdatedAt);
    parts.push(date ? `${p.priceText} · cập nhật ${date}` : p.priceText);
  } else {
    parts.push("Chưa có giá");
  }
  parts.push(p.category?.name ?? "Chưa có Danh mục");
  return parts.join(" · ");
}

function SearchForm({ q }: { q: string }) {
  return (
    <Form action={LIST_PATH} role="search" className="flex gap-2" key={q}>
      <label htmlFor="product-search" className="sr-only">
        Tìm Sản phẩm theo tên
      </label>
      <Input id="product-search" type="search" name="q" defaultValue={q} placeholder="Tìm theo tên" autoComplete="off" />
      <Button type="submit" variant="outline" size="lg">
        <Search aria-hidden /> Tìm
      </Button>
    </Form>
  );
}

function Pagination({ q, page, pages }: { q: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  const link = (target: number, label: string, Icon: typeof ChevronLeft, after = false) => (
    <Link
      href={pageHref(q, target)}
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

export async function ProductListScreen({ searchParams }: Pick<PageProps<"/cms/san-pham">, "searchParams">) {
  const params = await searchParams;
  const q = first(params.q).trim();
  const page = Math.max(1, Math.floor(Number(first(params.trang))) || 1);
  const { items, total } = await listProductsForCms({ q, page });
  const pages = Math.ceil(total / PRODUCT_PAGE_SIZE);
  const filtered = q !== "" || page > 1;

  return (
    <div className="flex flex-col gap-space-md">
      <h1 className="text-headline-lg-mobile lg:text-headline-lg">Sản phẩm</h1>
      {total === 0 && !filtered ? (
        <div className="space-y-space-md rounded-xl border p-space-lg text-center">
          <p className="text-on-surface-variant">Chưa có Sản phẩm nào. Tạo Sản phẩm đầu tiên.</p>
          <CreateLink />
        </div>
      ) : (
        <>
          {/* Mobile: nút tạo dính đáy (sau danh sách); desktop: ngay dưới tiêu đề. */}
          <div className="sticky-bar sticky bottom-0 z-20 order-last -mx-margin border-t px-margin pt-space-sm pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-sticky-bottom lg:static lg:order-none lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <CreateLink />
          </div>
          <SearchForm q={q} />
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
                    <Link
                      href={`${LIST_PATH}/${p.id}`}
                      className="block space-y-1 rounded-xl border bg-card p-space-md hover:bg-surface-container"
                    >
                      <span className="flex items-start justify-between gap-space-sm">
                        <span className="min-w-0 text-headline-sm">{p.name}</span>
                        <ProductStatusBadge />
                      </span>
                      <span className="block text-body-sm text-on-surface-variant">{meta(p)}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <table className="hidden w-full text-left text-body-sm lg:table">
                <thead className="text-on-surface-variant">
                  <tr className="border-b">
                    <th scope="col" className="py-2 pr-4 font-medium">Tên</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Giá tham khảo</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Danh mục</th>
                    <th scope="col" className="py-2 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-semibold">
                        <Link href={`${LIST_PATH}/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-on-surface-variant">
                        {p.priceText ? (
                          <>
                            {p.priceText}
                            {p.priceUpdatedAt && (
                              <span className="block">cập nhật {formatShortDate(p.priceUpdatedAt)}</span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 pr-4 text-on-surface-variant">{p.category?.name ?? "—"}</td>
                      <td className="py-2">
                        <ProductStatusBadge />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination q={q} page={page} pages={pages} />
            </>
          )}
        </>
      )}
    </div>
  );
}
