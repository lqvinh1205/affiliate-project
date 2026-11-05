import type { Metadata } from "next";
import { NotFoundScreen } from "@/app/(site)/_components/not-found-screen";

export const metadata: Metadata = { title: "Không tìm thấy trang", robots: { index: false } };

export default function NotFound() {
  return <NotFoundScreen />;
}
