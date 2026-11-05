import type { ComponentProps } from "react";

// Mọi link tới Shopee trên site đi qua đây (spine AD-11, FR-25): nguyên Link affiliate, tab mới,
// `rel="sponsored nofollow noopener"`, không qua đường chuyển hướng nội bộ, không đếm click.
// `target`/`rel` đặt sau props nên nơi gọi không ghi đè được.
export function AffiliateLink({
  href,
  children,
  ...props
}: Omit<ComponentProps<"a">, "href" | "target" | "rel"> & { href: string }) {
  return (
    <a {...props} href={href} target="_blank" rel="sponsored nofollow noopener">
      {children}
    </a>
  );
}
