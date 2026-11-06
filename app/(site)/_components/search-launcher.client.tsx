"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SEARCH_QUERY_MAX } from "@/modules/posts/constants";
import { SearchBox } from "@/modules/posts/components/search-box.client";
import { SEARCH_PATH } from "@/app/(site)/_components/site-nav";

// SearchBox ở trang 404 (UX-DR68): Enter mở `/tim-kiem?q=…` (trang Tìm kiếm tìm ngay khi hiện).
export function SearchLauncher() {
  const router = useRouter();
  const [value, setValue] = useState("");
  return (
    <SearchBox
      value={value}
      onValueChange={setValue}
      maxLength={SEARCH_QUERY_MAX}
      onSubmit={() => {
        const q = value.trim();
        router.push(q ? `${SEARCH_PATH}?q=${encodeURIComponent(q)}` : SEARCH_PATH);
      }}
    />
  );
}
