import "server-only";
import { z } from "zod";
import { UserError } from "@/platform/errors";
import { AI_COMMON_RULES } from "@/platform/ai/rules";
import { claudeCliProvider } from "@/platform/ai/providers/claude-cli";
import { fakeProviders } from "@/platform/ai/providers/fake";
import {
  ProviderError,
  type AiProvider,
  type ProviderFailure,
  type PromptProfile,
} from "@/platform/ai/providers/types";

export type { PromptProfile } from "@/platform/ai/providers/types";

// Cửa duy nhất gọi AI (spine AD-10, NFR-1, NFR-2). Module nghiệp vụ chỉ gọi `ask()` với một `PromptDef`
// đặt ở `modules/<miền>/prompts/*.prompt.ts`.

export type AiCapability = "images" | "webSearch" | "video";
export type AiSource = { url: string; title: string };

// Khuôn prompt (AD-10). `system(style)` nhận Hồ sơ phong cách khi tính năng có (Epic 5); `output` là Zod không
// có transform (sinh được JSON Schema cho nhà cung cấp).
export type PromptDef<Input, Output extends z.ZodType, Style = void> = {
  id: string;
  version: number;
  profile: PromptProfile;
  output: Output;
  system: (style: Style) => string;
  user: (input: Input) => string;
};

export type AskOptions<Input, Output extends z.ZodType, Style> = {
  prompt: PromptDef<Input, Output, Style>;
  input: Input;
  style?: Style;
  images?: string[];
  videoUrl?: string;
  webSearch?: boolean;
};

export type AskResult<T> = { data: T; sources?: AiSource[]; skipped: AiCapability[] };

const PROVIDERS: Record<string, AiProvider> = { "claude-cli": claudeCliProvider, ...fakeProviders };

// Hạn mỗi lần `ask` (gồm cả thử lại và chuyển nhà) — NFR-3, AD-18. `maxDuration` của route là 120 giây.
const DEFAULT_TIMEOUT_MS = 90_000;

// Thời gian tạm bỏ qua một nhà sau khi lỗi (A1): hết hạn mức 6 giờ, treo 2 phút, lỗi khác 60 giây.
// Giữ trong bộ nhớ tiến trình (spine giả định một tiến trình — Deferred "Nhiều instance").
const COOLDOWN_MS: Record<ProviderFailure, number> = { quota: 6 * 3600_000, timeout: 120_000, unavailable: 60_000 };
const cooldownUntil = new Map<string, number>();

export function resetAiCooldowns() {
  cooldownUntil.clear();
}

export const AI_UNAVAILABLE = "AI đang bận hoặc không phản hồi. Dữ liệu của bạn vẫn giữ nguyên, thử lại sau.";
export const AI_BAD_OUTPUT = "AI trả kết quả chưa đúng định dạng. Dữ liệu của bạn vẫn giữ nguyên, thử lại sau.";

// Chuỗi nhà theo thứ tự ưu tiên từ `AI_PROVIDERS` (mặc định `claude-cli`). Tên lạ → lỗi cấu hình (fail closed).
function providerChain() {
  const names = (process.env.AI_PROVIDERS ?? "claude-cli")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const unknown = names.filter((n) => !PROVIDERS[n]);
  if (names.length === 0 || unknown.length > 0) {
    console.error(`[ai] AI_PROVIDERS không hợp lệ: ${unknown.join(", ") || "(trống)"}`);
    throw new UserError("Chưa cấu hình nhà cung cấp AI (AI_PROVIDERS). Xem .env.example.");
  }
  return names.map((n) => PROVIDERS[n]);
}

function timeoutMs() {
  const n = Number(process.env.AI_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

const rawSources = z.array(z.object({ url: z.string(), title: z.string() }));

// Nguồn hợp lệ: URL http(s), không trùng, tối đa 20.
function cleanSources(list: z.infer<typeof rawSources>): AiSource[] {
  const seen = new Set<string>();
  const out: AiSource[] = [];
  for (const s of list) {
    try {
      const url = new URL(s.url.trim());
      if (!/^https?:$/.test(url.protocol) || seen.has(url.href)) continue;
      seen.add(url.href);
      out.push({ url: url.href, title: s.title.trim().slice(0, 200) || url.hostname });
    } catch {
      continue;
    }
  }
  return out.slice(0, 20);
}

export async function ask<Input, Output extends z.ZodType, Style = void>(
  opts: AskOptions<Input, Output, Style>,
): Promise<AskResult<z.infer<Output>>> {
  const { prompt } = opts;
  const deadline = Date.now() + timeoutMs();
  const system = `${AI_COMMON_RULES}\n\n${prompt.system(opts.style as Style)}`;
  const user = prompt.user(opts.input);
  const images = opts.images ?? [];

  for (const provider of providerChain()) {
    if ((cooldownUntil.get(provider.name) ?? 0) > Date.now()) continue;

    const skipped: AiCapability[] = [];
    if (opts.videoUrl && !provider.supports.video) skipped.push("video");
    const useImages = images.length > 0 && provider.supports.images;
    if (images.length > 0 && !useImages) skipped.push("images");
    const webSearch = !!opts.webSearch && provider.supports.webSearch;

    // Tìm web: nhà trả thêm danh sách nguồn đã dùng cạnh dữ liệu (FR-6).
    const schema = webSearch ? z.object({ data: prompt.output, sources: rawSources }) : prompt.output;
    // Bỏ khoá `$schema` (draft 2020-12): `claude --json-schema` không nhận khai báo phiên bản này.
    const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
    delete jsonSchema.$schema;

    try {
      let message = user;
      for (let attempt = 1; ; attempt++) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new ProviderError("timeout", "hết hạn 90 giây");
        const res = await provider.generate({
          system,
          user: message,
          jsonSchema,
          profile: prompt.profile,
          images: useImages ? images : [],
          webSearch,
          timeoutMs: remaining,
        });
        const parsed = schema.safeParse(res.json);
        if (parsed.success) {
          if (useImages && res.imagesUsed === 0) skipped.push("images");
          if (!webSearch) {
            if (opts.webSearch) skipped.push("webSearch");
            return { data: parsed.data as z.infer<Output>, skipped };
          }
          const { data, sources } = parsed.data as { data: z.infer<Output>; sources: z.infer<typeof rawSources> };
          const clean = cleanSources(sources);
          // Tìm mà không ra nguồn nào cũng báo như không tìm được (UX-DR45).
          if (clean.length === 0) skipped.push("webSearch");
          return { data, sources: clean, skipped };
        }
        // Parse lỗi: thử lại đúng một lần kèm lỗi Zod (AD-10); lần hai vẫn lỗi → UserError.
        console.error(`[ai] ${provider.name} ${prompt.id}@${prompt.version}: kết quả sai schema (lần ${attempt})`);
        if (attempt >= 2) throw new UserError(AI_BAD_OUTPUT);
        message = `${user}\n\nLần trả lời trước chưa đúng định dạng JSON yêu cầu. Lỗi:\n${z.prettifyError(parsed.error)}\nHãy trả lại đúng schema.`;
      }
    } catch (e) {
      if (!(e instanceof ProviderError)) throw e;
      console.error(`[ai] ${provider.name} ${prompt.id}@${prompt.version}: ${e.reason} — ${e.message}`);
      cooldownUntil.set(provider.name, Date.now() + COOLDOWN_MS[e.reason]);
      if (Date.now() >= deadline) break;
    }
  }
  throw new UserError(AI_UNAVAILABLE);
}
