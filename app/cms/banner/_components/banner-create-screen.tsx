import { BannerForm } from "@/modules/banners/components/banner-form.client";
import { BannerScreenHeader } from "@/app/cms/banner/_components/banner-screen-header";

export function BannerCreateScreen() {
  return (
    <>
      <BannerScreenHeader title="Tạo Banner" />
      <BannerForm
        defaultValues={{ title: "", description: "", image: "", linkUrl: "", enabled: true, startsAt: "", endsAt: "" }}
      />
    </>
  );
}
