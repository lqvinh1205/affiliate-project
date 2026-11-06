import type { Metadata } from "next";
import { BannerCreateScreen } from "@/app/cms/banner/_components/banner-create-screen";

export const metadata: Metadata = { title: "Tạo Banner" };

export default function NewBannerPage() {
  return <BannerCreateScreen />;
}
