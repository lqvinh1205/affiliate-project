"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

// SearchBox (UX-DR31, DESIGN.md › SearchBox): ô lớn nền `surface-container-lowest`, viền `outline-variant`, focus viền
// `primary` 1.5px, kính lúp trái, nút xoá phải (làm rỗng và focus lại). Ô điều khiển: nơi dùng giữ giá trị, quyết định
// khi nào tìm (gõ có chờ / Enter). `autoFocus`: tự focus khi hiện (trang Tìm kiếm).
export function SearchBox({
  value,
  onValueChange,
  onSubmit,
  autoFocus = false,
  maxLength,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="relative"
    >
      <label htmlFor="tu-khoa" className="sr-only">
        Tìm mẹo, bài viết
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-on-surface-variant"
        strokeWidth={1.5}
        aria-hidden
      />
      <input
        ref={input}
        id="tu-khoa"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Tìm mẹo, ví dụ: nồi chiên"
        className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pr-12 pl-12 text-body-regular outline-none placeholder:text-on-surface-variant focus:border-primary focus:shadow-[0_0_0_0.5px_var(--primary)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Xoá từ khoá"
          onClick={() => {
            onValueChange("");
            input.current?.focus();
          }}
          className="absolute top-1/2 right-1 inline-flex size-touch-target -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant outline-offset-2 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      )}
    </form>
  );
}
