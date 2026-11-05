import type { Metadata } from "next";
import { CmsShell } from "@/app/cms/_components/cms-shell.client";

export const metadata: Metadata = {
  title: "CMS",
  robots: { index: false, follow: false },
};

// Gọi AI có thể mất 20–40 giây; AD-18 đặt trần 120 giây cho route kích hoạt AI.
export const maxDuration = 120;

export default function CmsLayout({ children }: LayoutProps<"/cms">) {
  return <CmsShell>{children}</CmsShell>;
}
