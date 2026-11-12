import { SITE_NAME } from "@/platform/site";

// Logo chữ của SiteHeader/SiteFooter: chữ đầu của `SITE_NAME` màu thường, phần còn lại màu primary.
export function SiteLogoText() {
  const [first, ...rest] = SITE_NAME.split(" ");
  return (
    <>
      {first} <span className="text-primary">{rest.join(" ")}</span>
    </>
  );
}
