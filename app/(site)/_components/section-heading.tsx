import Link from "next/link";

export function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b pb-3">
      <h2 className="text-2xl">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-primary hover:underline">
          Xem tất cả →
        </Link>
      )}
    </div>
  );
}
