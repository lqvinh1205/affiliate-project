import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchScreen } from "@/app/(site)/tim-kiem/_components/search-screen";
import { SearchSkeleton } from "@/app/(site)/tim-kiem/_components/search-skeleton";

// Tìm kiếm: `noindex`, không canonical, không vào sitemap (AD-26). Trang tĩnh; kết quả lấy phía client (AD-7).
export const metadata: Metadata = { title: "Tìm kiếm", robots: { index: false } };

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchScreen />
    </Suspense>
  );
}
