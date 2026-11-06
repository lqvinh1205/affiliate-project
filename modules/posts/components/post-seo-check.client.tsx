"use client";

import { useState, useTransition } from "react";
import { Gauge, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Result } from "@/platform/errors";
import { SeoScore } from "@/modules/posts/components/seo-score";
import { callAction } from "@/components/shared/call-action";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type SeoCheckInput = { title: string; seoTitle: string; seoDescription: string; content: string; keywords: string[] };
export type SeoCheckAction = (
  input: SeoCheckInput,
) => Promise<Result<{ report: { score: number; suggestions: string[] } }>>;

// SeoCheckPanel (UX-DR52): chấm điểm SEO bằng AI qua `posts.checkPostSeo`, đọc giá trị form lúc bấm. Kết quả chỉ
// đọc, không lưu, không qua Duyệt (ngoại lệ AD-9).
export function PostSeoCheck({ getInput, seoCheck }: { getInput: () => SeoCheckInput; seoCheck: SeoCheckAction }) {
  const [report, setReport] = useState<{ score: number; suggestions: string[] } | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const res = await callAction(() => seoCheck(getInput()));
      if (!res.ok) return void toast.error(res.error);
      setReport(res.report);
    });

  return (
    <>
      <Button type="button" variant="outline" size="lg" className="w-full" disabled={pending} onClick={run}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Gauge aria-hidden />}
        {pending ? "AI đang chấm điểm…" : "Chấm điểm SEO bằng AI"}
      </Button>
      {report && (
        <Card aria-live="polite" className="flex flex-col items-center gap-space-md p-space-md sm:flex-row sm:items-start">
          <SeoScore score={report.score} className="shrink-0" />
          <ul className="list-disc space-y-1.5 pl-5 text-body-sm">
            {report.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
