import { cn } from "@/components/ui/lib/utils";

// Điểm SEO (SeoCheckPanel — UX-DR52): vòng tiến độ + điểm `headline-lg`; một màu `primary` cho mọi mức điểm
// (không đỏ/xanh theo điểm).
export function SeoScore({ score, className }: { score: number; className?: string }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative size-28", className)}>
      <svg viewBox="0 0 100 100" className="-rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-surface-container-high" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="text-primary transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-headline-lg">{score}</span>
        <span className="text-label-meta text-on-surface-variant">điểm SEO</span>
      </div>
    </div>
  );
}
