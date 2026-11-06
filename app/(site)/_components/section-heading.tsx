import Link from "next/link";

export function SectionHeading({ title, href, id }: { title: string; href?: string; id?: string }) {
  return (
    <div className="mb-space-md flex items-end justify-between gap-space-md border-b pb-space-sm">
      <h2 id={id} className="text-headline-md lg:text-headline-lg">
        {title}
      </h2>
      {href && (
        <Link href={href} className="inline-flex min-h-touch-target shrink-0 items-center text-label-md text-primary hover:underline">
          Xem tất cả<span className="sr-only"> {title}</span>
        </Link>
      )}
    </div>
  );
}
