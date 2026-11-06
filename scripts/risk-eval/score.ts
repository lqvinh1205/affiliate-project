import { cleanRiskWarnings } from "@/platform/ai/rules";

export type Sample = { text: string; risky: boolean; type?: string };

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[“”"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?…]+$/, "");

// Chấm bộ câu mẫu (FR-23): kết quả AI qua `cleanRiskWarnings` như nội dung thật (bỏ mục rỗng, trùng); một câu mẫu được
// coi là bị đánh dấu khi có mục **bằng** câu đó sau chuẩn hoá — không so khớp chuỗi con, để mục rỗng hay mảnh ngắn
// ("100%") không khớp nhiều câu cùng lúc.
export function scoreRiskEval(samples: Sample[], warnings: { sentence: string; reason: string }[]) {
  const flagged = new Set(cleanRiskWarnings(warnings).map((w) => norm(w.sentence)).filter(Boolean));
  const hit = (s: Sample) => flagged.has(norm(s.text));
  const risky = samples.filter((s) => s.risky);
  const normal = samples.filter((s) => !s.risky);
  const missed = risky.filter((s) => !hit(s));
  const falsePositive = normal.filter(hit);
  const recall = risky.length ? (risky.length - missed.length) / risky.length : 1;
  const fpr = normal.length ? falsePositive.length / normal.length : 0;
  return { caught: risky.length - missed.length, risky: risky.length, normal: normal.length, missed, falsePositive, recall, fpr, pass: recall >= 0.9 && fpr <= 0.2 };
}
