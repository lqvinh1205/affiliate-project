"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { formatCount } from "@/platform/format";
import { searchPosts } from "@/modules/posts/actions";
import { SEARCH_QUERY_MIN } from "@/modules/posts/constants";
import type { SearchPostItem } from "@/modules/posts/types";
import { PostCard } from "@/modules/posts/components/post-card";
import { SearchBox } from "@/modules/posts/components/search-box.client";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Chờ ngừng gõ rồi mới tìm (UX-DR31); Enter tìm ngay.
const TYPING_DELAY_MS = 300;

type SearchView =
  | { kind: "idle" }
  | { kind: "results"; query: string; total: number; terms: string[]; items: SearchPostItem[] }
  | { kind: "error"; query: string };

type PostSearchProps = {
  // Từ khoá có sẵn (`/tim-kiem?q=` — từ SearchBox ở trang 404); tìm ngay khi hiện.
  initialQuery: string;
  // Chưa gõ: chip Danh mục (UX-DR30, UX-DR67).
  idle: ReactNode;
  // Không có kết quả: khu Xem nhiều kèm EmptyState (UX-DR67).
  noResults: ReactNode;
};

function ResultSkeleton() {
  return (
    <ul aria-hidden className="divide-y">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i} className="flex gap-space-md py-space-md">
          <Skeleton className="size-20 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Tìm kiếm không dấu (FR-36, UX-DR31, UX-DR32, UX-DR67): kết quả lấy phía client qua action công khai chỉ đọc
// `searchPosts` (AD-6, AD-7). Gõ ≥ 2 ký tự → tìm sau 300 ms ngừng gõ; 1 ký tự giữ nguyên trạng thái trước; xoá hết
// → về trạng thái chưa gõ. Đang tìm: 3 Skeleton dòng (hoặc kết quả cũ mờ đi). Có kết quả: "Tìm thấy N bài viết cho
// "…"" (`aria-live`) + SearchResultItem (PostCard *row*, tô từ khớp). Không kết quả: EmptyState + gợi ý gõ ngắn hơn +
// Xem nhiều. Lỗi / bị giới hạn tần suất: câu báo + "Thử lại". Chỉ câu trả lời của lần tìm mới nhất được hiện.
export function PostSearch({ initialQuery, idle, noResults }: PostSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<SearchView>({ kind: "idle" });
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  const run = (q: string) => {
    window.clearTimeout(timer.current);
    const id = ++latest.current;
    setLoading(true);
    const done = (next: SearchView) => {
      if (id !== latest.current) return; // đã có lần tìm mới hơn
      setLoading(false);
      setView(next);
    };
    searchPosts({ q })
      .then((res) =>
        done(res.ok ? { kind: "results", query: q, total: res.total, terms: res.terms, items: res.items } : { kind: "error", query: q }),
      )
      .catch(() => done({ kind: "error", query: q }));
  };

  const onValueChange = (value: string) => {
    setQuery(value);
    window.clearTimeout(timer.current);
    const q = value.trim();
    if (q === "") {
      latest.current++; // bỏ câu trả lời đang chờ
      setLoading(false);
      setView({ kind: "idle" });
      return;
    }
    if (q.length < SEARCH_QUERY_MIN) return;
    timer.current = window.setTimeout(() => run(q), TYPING_DELAY_MS);
  };

  const onSubmit = () => {
    const q = query.trim();
    if (q.length >= SEARCH_QUERY_MIN) run(q);
  };

  // Có từ khoá trên URL (đến từ trang 404): tìm một lần khi hiện.
  const initial = useRef(initialQuery.trim());
  useEffect(() => {
    const q = initial.current;
    initial.current = "";
    if (q.length >= SEARCH_QUERY_MIN) run(q);
    return () => window.clearTimeout(timer.current);
  }, []);

  const status =
    view.kind === "results" ? `Tìm thấy ${formatCount(view.total)} bài viết cho "${view.query}"` : "";

  return (
    <div className="space-y-space-md">
      <SearchBox value={query} onValueChange={onValueChange} onSubmit={onSubmit} autoFocus />
      <p aria-live="polite" className={status ? "text-label-md text-on-surface-variant" : "sr-only"}>
        {status}
      </p>

      {view.kind === "results" ? (
        <div aria-busy={loading} className={loading ? "opacity-50 transition-opacity motion-reduce:transition-none" : undefined}>
          {view.total > 0 ? (
            <ul className="divide-y">
              {view.items.map((p) => (
                <li key={p.slug}>
                  <PostCard
                    post={{ ...p, publishedAt: p.publishedAt ? new Date(p.publishedAt) : null }}
                    variant="row"
                    headingLevel="h2"
                    highlight={view.terms}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-space-lg">
              <EmptyState
                title="Chưa tìm thấy mẹo nào phù hợp với từ khoá này rồi..."
                description="Bạn thử gõ ngắn hơn, chỉ tên món đồ hoặc việc cần làm, ví dụ “nồi chiên” hay “giặt”."
              />
              {noResults}
            </div>
          )}
        </div>
      ) : loading ? (
        <ResultSkeleton />
      ) : view.kind === "error" ? (
        <div role="alert" className="space-y-space-md rounded-xl border p-space-lg text-center">
          <p className="text-body-regular">Chưa tìm được lúc này, thử lại nhé</p>
          <Button type="button" variant="outline" size="lg" className="min-h-touch-target" onClick={() => run(view.query)}>
            Thử lại
          </Button>
        </div>
      ) : (
        idle
      )}
    </div>
  );
}

// `PostSearch` lấy từ khoá ban đầu từ `?q=` phía client (`useSearchParams` trong `<Suspense>` — trang vẫn tĩnh, server
// không đọc `searchParams` — AD-7). Đổi `?q=` (tìm lại từ trang 404) thì dựng lại từ đầu.
export function PostSearchFromUrl(props: Omit<PostSearchProps, "initialQuery">) {
  const q = useSearchParams().get("q") ?? "";
  return <PostSearch key={q} initialQuery={q} {...props} />;
}
