import type { Metadata } from "next";
import { StyleguideScreen } from "@/app/cms/styleguide/_components/styleguide-screen";

// Trang nội bộ duyệt design system dưới /cms (noindex, sau Basic Auth).
export const metadata: Metadata = { title: "Styleguide", robots: { index: false } };

export default function StyleguidePage() {
  return <StyleguideScreen />;
}
