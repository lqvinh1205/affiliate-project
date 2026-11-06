import "server-only";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isAllowedImageUrl } from "@/platform/images";
import { SITE_URL } from "@/platform/site";
import {
  ProviderError,
  type AiProvider,
  type ProviderRequest,
  type ProviderResult,
} from "@/platform/ai/providers/types";

// Nhà cung cấp chính (Vinh chốt tạm 2026-11-05, spine Deferred): Claude Code CLI chạy không giao diện
// (`claude -p`) trên máy chủ, đăng nhập bằng gói thuê bao. Mỗi lần gọi:
// - chạy trong một thư mục tạm riêng (`--restricted` giới hạn công cụ file trong thư mục này, `--safe-mode` bỏ
//   CLAUDE.md, skill, hook, MCP của máy), không lưu phiên;
// - chỉ bật công cụ cần: `Read` khi có ảnh (ảnh tải về thư mục tạm), `WebSearch`/`WebFetch` khi tìm web; luật cho
//   phép `Read` chỉ mở đúng thư mục tạm (không dùng `Read` trần — luật trần cho phép đọc mọi đường dẫn, mà cùng lần
//   gọi có dữ liệu ngoài như đánh giá Shopee, trang web và có `WebFetch`);
// - kết quả theo `--json-schema`, đọc ở `structured_output` của `--output-format json`;
// - tiến trình con chỉ nhận biến môi trường cần để chạy và đăng nhập (không có DATABASE_URL, mật khẩu CMS…).

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
// Biến môi trường cho tiến trình con: đủ để chạy và đọc đăng nhập (`HOME`, `CLAUDE_CONFIG_DIR`). Không chuyển biến
// phiên `CLAUDE_CODE_*` (khi máy chủ được chạy từ trong một phiên Claude Code) để tiến trình con là phiên độc lập.
const ENV_KEEP = [
  "PATH",
  "HOME",
  "USER",
  "LOGNAME",
  "LANG",
  "LC_ALL",
  "TMPDIR",
  "XDG_CONFIG_HOME",
  "XDG_DATA_HOME",
  "CLAUDE_CONFIG_DIR",
];

function model(profile: ProviderRequest["profile"]) {
  return profile === "fast"
    ? process.env.CLAUDE_CLI_MODEL_FAST?.trim() || "haiku"
    : process.env.CLAUDE_CLI_MODEL_QUALITY?.trim() || "sonnet";
}

// Tham số dòng lệnh cho một lần gọi (tách riêng để test).
export function buildClaudeArgs(req: ProviderRequest, opts: { hasImages: boolean; dir: string }) {
  const web = req.webSearch ? ["WebSearch", "WebFetch"] : [];
  const tools = [...(opts.hasImages ? ["Read"] : []), ...web];
  // Đường dẫn tuyệt đối trong luật quyền viết dạng `//abs/path/**`.
  const allowed = [...(opts.hasImages ? [`Read(/${path.resolve(opts.dir)}/**)`] : []), ...web];
  return [
    "-p",
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(req.jsonSchema),
    "--system-prompt",
    req.system,
    "--model",
    model(req.profile),
    "--no-session-persistence",
    "--safe-mode",
    "--restricted",
    "--permission-prompts",
    "none",
    "--tools",
    tools.join(","),
    ...(allowed.length > 0 ? ["--allowedTools", allowed.join(",")] : []),
  ];
}

function childEnv(): NodeJS.ProcessEnv {
  const env = {} as NodeJS.ProcessEnv;
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && (ENV_KEEP.includes(k) || k.startsWith("ANTHROPIC_"))) {
      env[k] = v;
    }
  }
  return env;
}

// Tải ảnh (chỉ URL qua `isAllowedImageUrl`) về thư mục tạm để model đọc bằng công cụ Read. Ảnh lỗi bị bỏ qua.
async function downloadImages(urls: string[], dir: string, signal: AbortSignal) {
  const files: string[] = [];
  for (const url of urls.filter(isAllowedImageUrl).slice(0, MAX_IMAGES)) {
    try {
      const res = await fetch(new URL(url, SITE_URL), { signal, redirect: "error" });
      const type = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
      const ext = IMAGE_EXT[type];
      if (!res.ok || !ext) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) continue;
      const file = path.join(dir, `anh-${files.length + 1}${ext}`);
      await writeFile(file, buf);
      files.push(file);
    } catch {
      if (signal.aborted) break;
    }
  }
  return files;
}

// Hết hạn mức (cooldown dài): chỉ khớp cụm từ hoặc mã HTTP 429 đi sau "API Error"/"status"/"HTTP" — không khớp
// "429" nằm trong mã yêu cầu, số byte… "overloaded" (HTTP 529) là quá tải tạm thời, tính là `unavailable`.
const QUOTA = /usage limit|rate[ _]limit|quota|too many requests|\b(?:api error|status|http)\W{0,3}429\b/i;

function run(args: string[], stdin: string, cwd: string, signal: AbortSignal) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const bin = process.env.CLAUDE_CLI_PATH?.trim() || "claude";
    const child = spawn(bin, args, { cwd, env: childEnv(), signal, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    // Giải mã UTF-8 theo luồng: ký tự tiếng Việt nhiều byte bị cắt giữa hai đoạn không thành U+FFFD.
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (d: string) => (stdout += d));
    child.stderr.on("data", (d: string) => (stderr += d));
    // `claude` thoát trước khi đọc hết stdin → EPIPE trên luồng stdin; bỏ qua để mã thoát ở "close" báo lỗi
    // (không có listener thì thành uncaught exception làm sập tiến trình Next).
    child.stdin.on("error", () => {});
    child.on("error", (e) => {
      if (signal.aborted) reject(new ProviderError("timeout", "claude -p quá hạn"));
      else reject(new ProviderError("unavailable", `không chạy được claude: ${e.message}`));
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(stdin);
  });
}

// Đọc kết quả của `--output-format json`: `structured_output` khi có `--json-schema`; dự phòng `result` là JSON.
export function parseClaudeOutput(stdout: string, stderr: string, code: number | null): unknown {
  let out: { is_error?: boolean; subtype?: string; result?: unknown; structured_output?: unknown } | null = null;
  try {
    out = JSON.parse(stdout);
  } catch {
    out = null;
  }
  const text = `${typeof out?.result === "string" ? out.result : ""} ${stderr}`;
  if (!out || out.is_error || code !== 0) {
    const reason = QUOTA.test(text) ? "quota" : "unavailable";
    // Chỉ ghi một đoạn ngắn của stderr để chẩn đoán (lỗi tham số, đăng nhập); không ghi prompt hay kết quả.
    const detail = out?.subtype ?? (stderr.trim().slice(0, 200) || "không đọc được kết quả");
    throw new ProviderError(reason, `claude -p lỗi (mã ${code}, ${detail})`);
  }
  if (out.structured_output !== undefined) return out.structured_output;
  if (typeof out.result === "string") {
    try {
      return JSON.parse(out.result.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch {
      // Không phải JSON: để `ask` thử lại kèm lỗi định dạng.
      return out.result;
    }
  }
  return out.result;
}

export const claudeCliProvider: AiProvider = {
  name: "claude-cli",
  supports: { images: true, webSearch: true, video: false },
  async generate(req): Promise<ProviderResult> {
    const signal = AbortSignal.timeout(Math.max(1, req.timeoutMs));
    const dir = await mkdtemp(path.join(os.tmpdir(), "ai-claude-"));
    try {
      const images = req.images.length > 0 ? await downloadImages(req.images, dir, signal) : [];
      const user =
        images.length > 0
          ? `${req.user}\n\nẢnh Sản phẩm (mở từng file bằng công cụ Read để xem):\n${images.map((f) => `- ${f}`).join("\n")}`
          : req.user;
      const { code, stdout, stderr } = await run(buildClaudeArgs(req, { hasImages: images.length > 0, dir }), user, dir, signal);
      if (signal.aborted) throw new ProviderError("timeout", "claude -p quá hạn");
      return { json: parseClaudeOutput(stdout, stderr, code), imagesUsed: images.length };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
};
