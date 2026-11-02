import { cn } from "@/lib/utils";

export function SeoScore({ score, className }: { score: number; className?: string }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const tone =
    score >= 80 ? "text-meo-vat" : score >= 50 ? "text-chart-3" : "text-destructive";
  return (
    <div className={cn("relative size-28", className)}>
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
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
          className={cn("transition-[stroke-dashoffset] duration-700", tone)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">điểm SEO</span>
      </div>
    </div>
  );
}
