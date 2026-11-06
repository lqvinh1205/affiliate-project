import Link from "next/link";
import { connection } from "next/server";
import { ExternalLink } from "lucide-react";
import { getBioForCms } from "@/modules/bio/cms-queries";
import { BioProductList } from "@/modules/bio/components/bio-product-list.client";
import { BioSettingsForm } from "@/modules/bio/components/bio-settings-form.client";

// Trang bio (CMS) `/cms/bio` (UX-DR80, FR-31): giới thiệu + câu chữ nhãn, rồi BioProductList (chọn / ghim / sắp xếp).
// Đọc lúc request (CMS không cache — AD-7).
export async function BioCmsScreen() {
  await connection();
  const { settings, pinned, rest } = await getBioForCms();
  return (
    <div className="space-y-space-lg">
      <div className="flex flex-wrap items-end justify-between gap-space-sm">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg">Trang bio</h1>
        <Link
          href="/bio"
          target="_blank"
          className="inline-flex min-h-touch-target items-center gap-space-xs text-label-md text-primary hover:underline"
        >
          Xem /bio <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden />
          <span className="sr-only">(mở tab mới)</span>
        </Link>
      </div>
      <section aria-labelledby="bio-settings" className="space-y-space-md rounded-xl border bg-card p-space-md">
        <h2 id="bio-settings" className="text-headline-sm">
          Giới thiệu và nhãn công khai
        </h2>
        <BioSettingsForm defaultValues={settings} />
      </section>
      <section aria-labelledby="bio-products" className="space-y-space-sm">
        <h2 id="bio-products" className="text-headline-sm">
          Sản phẩm trên bio
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          Sản phẩm mới tự hiện trên bio. Sản phẩm đang ẩn khỏi website không có trong danh sách. Mỗi thao tác lưu ngay.
        </p>
        <BioProductList pinned={pinned} rest={rest} />
      </section>
    </div>
  );
}
