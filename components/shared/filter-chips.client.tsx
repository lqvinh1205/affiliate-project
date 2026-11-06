"use client";

export type FilterChip = { value: string; label: string; count?: number };

// FilterChips (UX-DR30, DESIGN.md › FilterChips): chip cao 36px, vùng bấm 44px (`before` nới 4px trên/dưới), cách
// nhau `space-sm`; hàng cuộn ngang không thanh cuộn, chip vừa chọn cuộn vào giữa. Chỉ đổi trạng thái qua `onChange`
// (lọc phía client, không đổi URL — nơi dùng quyết định). Mỗi chip là nút `aria-pressed`.
export function FilterChips({
  label,
  chips,
  value,
  onChange,
}: {
  label: string;
  chips: FilterChip[];
  value: string;
  onChange: (value: string) => void;
}) {
  const select = (chip: FilterChip, button: HTMLButtonElement) => {
    onChange(chip.value);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    button.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-margin flex snap-x scroll-px-margin gap-space-sm overflow-x-auto px-margin py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((chip) => {
        const active = chip.value === value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={active}
            onClick={(e) => select(chip, e.currentTarget)}
            className={`relative inline-flex h-9 shrink-0 snap-start items-center gap-1 rounded-full px-space-md text-label-md whitespace-nowrap outline-offset-2 before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-2 focus-visible:outline-primary ${
              active ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span className="tabular-nums">
                <span aria-hidden>·</span> {chip.count}
                <span className="sr-only"> món</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
