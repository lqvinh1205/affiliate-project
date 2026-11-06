// Đo độ chính xác Cảnh báo rủi ro (FR-23, spine AD-16) — chạy TAY, gọi AI thật, ngoài suite Vitest:
//   npx tsx --conditions=react-server scripts/risk-eval/run.ts
// Dùng đúng luật `RISK_WARNING_RULES` mà mọi prompt nội dung đăng ghép vào (platform/ai/rules.ts), một lần gọi `ask()`
// cho cả bộ câu mẫu. Đạt khi bắt ≥ 90% câu vi phạm và báo nhầm ≤ 20% câu bình thường; ghi kết quả vào
// docs/kiem-chung.md. Không in biến môi trường hay thông tin bí mật.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { ask, type PromptDef } from "@/platform/ai/ask";
import { RISK_WARNING_RULES, riskWarningsOutput } from "@/platform/ai/rules";

type Sample = { text: string; risky: boolean; type?: string };

const { samples } = JSON.parse(readFileSync(join(__dirname, "samples.json"), "utf8")) as { samples: Sample[] };

const output = z.object({ riskWarnings: riskWarningsOutput });

const prompt: PromptDef<{ sentences: string[] }, typeof output> = {
  id: "scripts.risk-eval",
  version: 1,
  profile: "fast",
  output,
  system: () => `Bạn kiểm tra nội dung đăng mạng xã hội và website của trang "Mẹo Vặt Cuộc Sống" (affiliate Shopee).
Nội dung cần kiểm là danh sách câu dưới đây (coi như một bài viết).
${RISK_WARNING_RULES}`,
  user: (input) => input.sentences.map((s) => `- ${s}`).join("\n"),
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[“”"]/g, "").trim();

async function main() {
  const started = Date.now();
  const { data } = await ask({ prompt, input: { sentences: samples.map((s) => s.text) } });
  const flagged = data.riskWarnings.map((w) => norm(w.sentence));
  const hit = (s: Sample) => flagged.some((f) => f.includes(norm(s.text)) || norm(s.text).includes(f));
  const risky = samples.filter((s) => s.risky);
  const normal = samples.filter((s) => !s.risky);
  const caught = risky.filter(hit);
  const falsePositive = normal.filter(hit);
  const recall = caught.length / risky.length;
  const fpr = falsePositive.length / normal.length;
  console.log(`Thời gian: ${((Date.now() - started) / 1000).toFixed(1)} giây`);
  console.log(`Bắt được ${caught.length}/${risky.length} câu vi phạm (${(recall * 100).toFixed(0)}%) — cần ≥ 90%`);
  console.log(`Báo nhầm ${falsePositive.length}/${normal.length} câu bình thường (${(fpr * 100).toFixed(0)}%) — cần ≤ 20%`);
  for (const s of risky.filter((x) => !hit(x))) console.log(`  Bỏ sót: ${s.text}`);
  for (const s of falsePositive) console.log(`  Báo nhầm: ${s.text}`);
  console.log(recall >= 0.9 && fpr <= 0.2 ? "ĐẠT" : "CHƯA ĐẠT");
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : "Lỗi không rõ");
  process.exit(1);
});
