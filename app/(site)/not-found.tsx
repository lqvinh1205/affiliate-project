import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">404</p>
      <h1 className="mt-3 text-3xl">Không tìm thấy trang</h1>
      <p className="mt-3 text-muted-foreground">Bài viết có thể đã bị gỡ hoặc đường dẫn không đúng.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-primary hover:underline">
        ← Về trang chủ
      </Link>
    </div>
  );
}
