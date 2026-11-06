import type { Metadata } from "next";
import { Suspense } from "react";
import { BannerEditScreen } from "@/app/cms/banner/_components/banner-edit-screen";
import { BannerFormSkeleton } from "@/app/cms/banner/_components/banner-form-skeleton";

export const metadata: Metadata = { title: "Sửa Banner" };

export default function EditBannerPage({ params }: PageProps<"/cms/banner/[id]">) {
  return (
    <Suspense fallback={<BannerFormSkeleton />}>
      <BannerEditScreen params={params} />
    </Suspense>
  );
}
