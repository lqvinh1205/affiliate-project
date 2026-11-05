import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { listCategoriesForCms } from "@/modules/posts/cms-queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";
import { CategoryList } from "@/app/cms/danh-muc/_components/category-list.client";

function CreateLink() {
  return (
    <Link href="/cms/danh-muc/moi" className={cn(buttonVariants({ size: "lg" }), "min-h-touch-target w-full lg:min-h-0 lg:w-auto")}>
      <Plus aria-hidden /> Tạo Danh mục
    </Link>
  );
}

export async function CategoryListScreen() {
  await connection();
  const categories = await listCategoriesForCms();

  return (
    <div className="flex flex-col gap-space-md">
      <h1 className="text-headline-lg-mobile lg:text-headline-lg">Danh mục</h1>
      {categories.length === 0 ? (
        <div className="space-y-space-md rounded-xl border p-space-lg text-center">
          <p className="text-on-surface-variant">Chưa có Danh mục nào. Tạo Danh mục đầu tiên.</p>
          <CreateLink />
        </div>
      ) : (
        <>
          {/* Mobile: nút tạo dính đáy (sau danh sách); desktop: ngay dưới tiêu đề. */}
          <div className="sticky-bar sticky bottom-0 z-20 order-last -mx-margin border-t px-margin pt-space-sm pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-sticky-bottom lg:static lg:order-none lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <CreateLink />
          </div>
          <CategoryList
            items={categories.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              posts: c._count.posts,
              products: c._count.products,
            }))}
          />
        </>
      )}
    </div>
  );
}
