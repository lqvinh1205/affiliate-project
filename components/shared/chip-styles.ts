// Hình chip (DESIGN.md › FilterChips, UX-DR30): cao 36px, vùng bấm 44px (`before` nới 4px trên/dưới). Dùng chung cho
// FilterChips (nút lọc) và chip link (Danh mục ở Tìm kiếm). Ghép chuỗi thường, không qua `cn` ([NO-25]).
export const CHIP_BASE =
  "relative inline-flex h-9 shrink-0 snap-start items-center gap-1 rounded-full px-space-md text-label-md whitespace-nowrap outline-offset-2 before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-2 focus-visible:outline-primary";
export const CHIP_IDLE = "bg-surface-container-high text-on-surface-variant hover:text-on-surface";
export const CHIP_ACTIVE = "bg-primary text-on-primary";
// Hàng chip cuộn ngang không thanh cuộn.
export const CHIP_ROW =
  "-mx-margin flex snap-x scroll-px-margin gap-space-sm overflow-x-auto px-margin py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
