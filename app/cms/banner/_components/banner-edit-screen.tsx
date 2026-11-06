import { notFound } from "next/navigation";
import { connection } from "next/server";
import { toVietnamDateTimeInput } from "@/platform/format";
import { getBannerForCms } from "@/modules/banners/cms-queries";
import { BannerForm } from "@/modules/banners/components/banner-form.client";
import { BannerStatusBadge } from "@/modules/banners/components/banner-status-badge";
import { BannerScreenHeader } from "@/app/cms/banner/_components/banner-screen-header";

export async function BannerEditScreen({ params }: Pick<PageProps<"/cms/banner/[id]">, "params">) {
  // Trạng thái lịch tính theo thời điểm của request.
  await connection();
  const { id } = await params;
  const banner = await getBannerForCms(id);
  if (!banner) notFound();

  return (
    <>
      <BannerScreenHeader title="Sửa Banner" badge={<BannerStatusBadge status={banner.status} />} />
      <BannerForm
        key={banner.id}
        defaultValues={{
          id: banner.id,
          title: banner.title,
          description: banner.description ?? "",
          image: banner.image,
          linkUrl: banner.linkUrl,
          enabled: banner.enabled,
          startsAt: toVietnamDateTimeInput(banner.startsAt),
          endsAt: toVietnamDateTimeInput(banner.endsAt),
        }}
      />
    </>
  );
}
