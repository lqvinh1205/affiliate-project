"use client";

import { ErrorScreen } from "@/components/shared/error-screen.client";
import "./globals.css";

// Lỗi ở root layout: thay cả tài liệu nên tự có `<html>`, `<body>`, CSS và `<title>` (không dùng được metadata).
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="vi">
      <body className="flex min-h-dvh items-center bg-background text-foreground">
        <title>Trang đang trục trặc một chút</title>
        <main className="flex-1">
          <ErrorScreen error={error} retry={retry} />
        </main>
      </body>
    </html>
  );
}
