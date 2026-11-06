import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import { buildClaudeArgs, claudeCliProvider, parseClaudeOutput } from "@/platform/ai/providers/claude-cli";
import { ProviderError, type ProviderRequest } from "@/platform/ai/providers/types";

const req: ProviderRequest = {
  system: "Hệ thống",
  user: "Câu hỏi",
  jsonSchema: { type: "object" },
  profile: "quality",
  images: [],
  webSearch: false,
  timeoutMs: 5_000,
};

afterEach(() => vi.unstubAllEnvs());

describe("buildClaudeArgs", () => {
  it("không ảnh, không tìm web thì tắt mọi công cụ; luôn chạy hạn chế, không lưu phiên", () => {
    const args = buildClaudeArgs(req, { hasImages: false });
    expect(args.slice(0, 3)).toEqual(["-p", "--output-format", "json"]);
    expect(args).toEqual(expect.arrayContaining(["--restricted", "--safe-mode", "--no-session-persistence"]));
    expect(args[args.indexOf("--tools") + 1]).toBe("");
    expect(args).not.toContain("--allowedTools");
    expect(args[args.indexOf("--json-schema") + 1]).toBe('{"type":"object"}');
    expect(args[args.indexOf("--model") + 1]).toBe("sonnet");
  });

  it("có ảnh và tìm web thì chỉ bật Read, WebSearch, WebFetch", () => {
    vi.stubEnv("CLAUDE_CLI_MODEL_FAST", "haiku-x");
    const args = buildClaudeArgs({ ...req, profile: "fast", webSearch: true }, { hasImages: true });
    expect(args[args.indexOf("--tools") + 1]).toBe("Read,WebSearch,WebFetch");
    expect(args[args.indexOf("--allowedTools") + 1]).toBe("Read,WebSearch,WebFetch");
    expect(args[args.indexOf("--model") + 1]).toBe("haiku-x");
  });
});

describe("parseClaudeOutput", () => {
  it("lấy structured_output", () => {
    const out = JSON.stringify({ type: "result", is_error: false, structured_output: { a: 1 }, result: "" });
    expect(parseClaudeOutput(out, "", 0)).toEqual({ a: 1 });
  });

  it("không có structured_output thì đọc result dạng JSON (bỏ khối ```json)", () => {
    const out = JSON.stringify({ is_error: false, result: '```json\n{"a":2}\n```' });
    expect(parseClaudeOutput(out, "", 0)).toEqual({ a: 2 });
  });

  it("hết hạn mức → ProviderError quota; lỗi khác → unavailable", () => {
    const limit = JSON.stringify({ is_error: true, subtype: "error", result: "Claude AI usage limit reached" });
    expect(() => parseClaudeOutput(limit, "", 1)).toThrow(expect.objectContaining({ reason: "quota" }));
    expect(() => parseClaudeOutput("không phải json", "lỗi lạ", 1)).toThrow(ProviderError);
    expect(() => parseClaudeOutput("không phải json", "lỗi lạ", 1)).toThrow(
      expect.objectContaining({ reason: "unavailable" }),
    );
  });
});

describe("claudeCliProvider.generate (CLI giả)", () => {
  let dir: string;
  const script = (body: string) => `#!/usr/bin/env node\n${body}\n`;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "claude-cli-test-"));
  });
  afterAll(() => rm(dir, { recursive: true, force: true }));

  async function fakeCli(name: string, body: string) {
    const file = path.join(dir, name);
    await writeFile(file, script(body));
    await chmod(file, 0o755);
    vi.stubEnv("CLAUDE_CLI_PATH", file);
  }

  it("gửi câu hỏi qua stdin, không truyền DATABASE_URL, mật khẩu CMS hay biến phiên Claude Code cho tiến trình con", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://bi-mat");
    vi.stubEnv("ADMIN_PASSWORD", "bi-mat");
    vi.stubEnv("CLAUDE_CODE_SESSION_ID", "phien-cha");
    await fakeCli(
      "ok.js",
      `let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(JSON.stringify({is_error:false,structured_output:{stdin:s,db:process.env.DATABASE_URL??null,admin:process.env.ADMIN_PASSWORD??null,session:process.env.CLAUDE_CODE_SESSION_ID??null,cwd:process.cwd()}}))});`,
    );
    const res = await claudeCliProvider.generate(req);
    expect(res.imagesUsed).toBe(0);
    expect(res.json).toMatchObject({ stdin: "Câu hỏi", db: null, admin: null, session: null });
    expect((res.json as { cwd: string }).cwd).toContain("ai-claude-");
  });

  it("quá hạn thì dừng tiến trình và ném ProviderError timeout", async () => {
    await fakeCli("slow.js", "setTimeout(()=>{},10000);");
    await expect(claudeCliProvider.generate({ ...req, timeoutMs: 200 })).rejects.toMatchObject({ reason: "timeout" });
  });

  it("không có lệnh claude thì ném ProviderError unavailable", async () => {
    vi.stubEnv("CLAUDE_CLI_PATH", path.join(dir, "khong-co"));
    await expect(claudeCliProvider.generate(req)).rejects.toMatchObject({ reason: "unavailable" });
  });
});
