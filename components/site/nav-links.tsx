import { CATEGORIES } from "@/lib/categories";

export const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  ...Object.values(CATEGORIES).map((c) => ({ href: `/${c.slug}`, label: c.label })),
];
