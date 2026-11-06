"use client";

import { CHIP_ACTIVE, CHIP_BASE, CHIP_IDLE, CHIP_ROW } from "@/components/shared/chip-styles";

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
      className={CHIP_ROW}
    >
      {chips.map((chip) => {
        const active = chip.value === value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={active}
            onClick={(e) => select(chip, e.currentTarget)}
            className={`${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
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
