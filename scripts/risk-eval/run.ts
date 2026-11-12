// Đo độ chính xác Cảnh báo rủi ro (FR-23, spine AD-16) — chạy TAY, gọi AI thật, ngoài suite Vitest:
//   npx tsx --conditions=react-server scripts/risk-eval/run.ts
// Dùng đúng luật `RISK_WARNING_RULES` mà mọi prompt nội dung đăng ghép vào (platform/ai/rules.ts), một lần gọi `ask()`
// cho cả bộ câu mẫu. Giới hạn: đây là prompt kiểm riêng trên danh sách câu; sản phẩm thì AI tự đánh dấu trong nội dung
// nó vừa viết (prompt Bài web/Threads/Facebook) — đo qua prompt nội dung thật còn hoãn (deferred-work.md). Đạt khi bắt ≥ 90% câu vi phạm và báo nhầm ≤ 20% câu bình thường; ghi kết quả vào
// docs/kiem-chung.md. Không in biến môi trường hay thông tin bí mật.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { ask, type PromptDef } from "@/platform/ai/ask";
import { RISK_WARNING_RULES, riskWarningsOutput } from "@/platform/ai/rules";
import { SITE_NAME } from "@/platform/site";
import { scoreRiskEval, type Sample } from "@/scripts/risk-eval/score";

const { samples } = JSON.parse(readFileSync(join(__dirname, "samples.json"), "utf8")) as { samples: Sample[] };

const output = z.object({ riskWarnings: riskWarningsOutput });

const prompt: PromptDef<{ sentences: string[] }, typeof output> = {
  id: "scripts.risk-eval",
  version: 2,
  profile: "fast",
  output,
  system: () => `Bạn kiểm tra nội dung đăng mạng xã hội và website của trang "${SITE_NAME}" (affiliate Shopee).
Nội dung cần kiểm là danh sách câu dưới đây (coi như một bài viết).
${RISK_WARNING_RULES}`,
  user: (input) => input.sentences.map((s) => `- ${s}`).join("\n"),
};

async function main() {
  const started = Date.now();
  const { data } = await ask({ prompt, input: { sentences: samples.map((s) => s.text) } });
  const r = scoreRiskEval(samples, data.riskWarnings);
  console.log(`Thời gian: ${((Date.now() - started) / 1000).toFixed(1)} giây`);
  console.log(`Bắt được ${r.caught}/${r.risky} câu vi phạm (${(r.recall * 100).toFixed(0)}%) — cần ≥ 90%`);
  console.log(`Báo nhầm ${r.falsePositive.length}/${r.normal} câu bình thường (${(r.fpr * 100).toFixed(0)}%) — cần ≤ 20%`);
  for (const s of r.missed) console.log(`  Bỏ sót: ${s.text}`);
  for (const s of r.falsePositive) console.log(`  Báo nhầm: ${s.text}`);
  console.log(r.pass ? "ĐẠT" : "CHƯA ĐẠT");
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : "Lỗi không rõ");
  process.exit(1);
});
