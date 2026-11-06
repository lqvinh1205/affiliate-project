import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { formatDateTime } from "@/platform/format";
import { listBannersForCms } from "@/modules/banners/cms-queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";
import { BannerList } from "@/app/cms/banner/_components/banner-list.client";

function CreateLink() {
  return (
    <Link href="/cms/banner/moi" className={cn(buttonVariants({ size: "lg" }), "min-h-touch-target w-full lg:min-h-0 lg:w-auto")}>
      <Plus aria-hidden /> Tạo Banner
    </Link>
  );
}

// Dòng lịch của một Banner (giờ Việt Nam, AD-27).
function scheduleText(startsAt: Date | null, endsAt: Date | null) {
  if (startsAt && endsAt) return `${formatDateTime(startsAt)} → ${formatDateTime(endsAt)}`;
  if (startsAt) return `Từ ${formatDateTime(startsAt)}`;
  if (endsAt) return `Đến ${formatDateTime(endsAt)}`;
  return "Không giới hạn thời gian";
}

// Màn `/cms/banner` (UX-DR79): danh sách theo thứ tự hiển thị trên site, StatusBadge, lịch, lên/xuống, sửa, xoá.
export async function BannerListScreen() {
  await connection();
  const banners = await listBannersForCms();

  return (
    <div className="flex flex-col gap-space-md">
      <h1 className="text-headline-lg-mobile lg:text-headline-lg">Banner</h1>
      {banners.length === 0 ? (
        <div className="space-y-space-md rounded-xl border p-space-lg text-center">
          <p className="text-on-surface-variant">
            Chưa có Banner nào. Tạo Banner cho dịp khuyến mãi; chỉ Banner đang bật và trong lịch mới lên Trang chủ.
          </p>
          <CreateLink />
        </div>
      ) : (
        <>
          {/* Mobile: nút tạo dính đáy (sau danh sách); desktop: ngay dưới tiêu đề. */}
          <div className="sticky-bar sticky bottom-0 z-20 order-last -mx-margin border-t px-margin pt-space-sm pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-sticky-bottom lg:static lg:order-none lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <CreateLink />
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Chỉ Banner &quot;Đang hiện&quot; lên Trang chủ, theo thứ tự dưới đây. Tới lịch hoặc hết lịch thì site tự đổi
            trong khoảng 1 phút.
          </p>
          <BannerList
            items={banners.map((b) => ({
              id: b.id,
              title: b.title,
              image: b.image,
              status: b.status,
              schedule: scheduleText(b.startsAt, b.endsAt),
            }))}
          />
        </>
      )}
    </div>
  );
}
