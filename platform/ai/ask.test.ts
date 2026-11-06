import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AI_BAD_OUTPUT, AI_UNAVAILABLE, ask, resetAiCooldowns, type PromptDef } from "@/platform/ai/ask";
import { fakeAi } from "@/platform/ai/providers/fake";
import { ProviderError } from "@/platform/ai/providers/types";
import { AI_COMMON_RULES } from "@/platform/ai/rules";
import { UserError } from "@/platform/errors";

const prompt: PromptDef<{ topic: string }, z.ZodObject<{ title: z.ZodString }>> = {
  id: "test.prompt",
  version: 3,
  profile: "fast",
  output: z.object({ title: z.string() }),
  system: () => "Hệ thống thử",
  user: (input) => `Chủ đề: ${input.topic}`,
};

beforeEach(() => {
  vi.stubEnv("AI_PROVIDERS", "fake");
  vi.spyOn(console, "error").mockImplementation(() => {});
  fakeAi.reset();
  resetAiCooldowns();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ask", () => {
  it("ghép quy tắc chung vào system, trả data đã parse và skipped rỗng", async () => {
    fakeAi.reply(() => ({ title: "Mẹo bếp" }));
    const res = await ask({ prompt, input: { topic: "bếp" } });
    expect(res).toEqual({ data: { title: "Mẹo bếp" }, skipped: [] });
    const [call] = fakeAi.calls();
    expect(call.system.startsWith(AI_COMMON_RULES)).toBe(true);
    expect(call.system).toContain("Hệ thống thử");
    expect(call.user).toBe("Chủ đề: bếp");
    expect(call.profile).toBe("fast");
    expect(call.jsonSchema).toMatchObject({ type: "object", required: ["title"] });
    // `claude --json-schema` từ chối khai báo draft 2020-12 (kiểm bằng lần gọi thật 2026-11-06).
    expect(call.jsonSchema).not.toHaveProperty("$schema");
  });

  it("parse lỗi một lần thì thử lại đúng một lần kèm lỗi Zod", async () => {
    let n = 0;
    fakeAi.reply(() => (++n === 1 ? { title: 42 } : { title: "Lần hai" }));
    const res = await ask({ prompt, input: { topic: "x" } });
    expect(res.data).toEqual({ title: "Lần hai" });
    expect(fakeAi.calls()).toHaveLength(2);
    expect(fakeAi.calls()[1].user).toContain("chưa đúng định dạng");
    expect(fakeAi.calls()[1].user).toContain("title");
  });

  it("parse lỗi hai lần thì ném UserError tiếng Việt, không thử lần ba", async () => {
    fakeAi.reply(() => ({ sai: true }));
    await expect(ask({ prompt, input: { topic: "x" } })).rejects.toEqual(new UserError(AI_BAD_OUTPUT));
    expect(fakeAi.calls()).toHaveLength(2);
  });

  it("nhà đầu lỗi hết hạn mức thì chuyển sang nhà sau và bỏ qua nhà lỗi ở lần gọi tiếp", async () => {
    vi.stubEnv("AI_PROVIDERS", "fake,fake-2");
    fakeAi.reply(() => {
      throw new ProviderError("quota", "hết hạn mức");
    });
    fakeAi.reply(() => ({ title: "Từ nhà dự phòng" }), "fake-2");
    expect((await ask({ prompt, input: { topic: "x" } })).data).toEqual({ title: "Từ nhà dự phòng" });
    await ask({ prompt, input: { topic: "y" } });
    expect(fakeAi.calls("fake")).toHaveLength(1);
    expect(fakeAi.calls("fake-2")).toHaveLength(2);
  });

  it("mọi nhà lỗi thì ném UserError tiếng Việt", async () => {
    fakeAi.reply(() => {
      throw new ProviderError("timeout", "treo");
    });
    await expect(ask({ prompt, input: { topic: "x" } })).rejects.toEqual(new UserError(AI_UNAVAILABLE));
  });

  it("lỗi không phải của nhà cung cấp thì ném ra nguyên vẹn", async () => {
    fakeAi.reply(() => {
      throw new TypeError("lỗi lập trình");
    });
    await expect(ask({ prompt, input: { topic: "x" } })).rejects.toBeInstanceOf(TypeError);
  });

  it("hết hạn 90 giây thì không gọi nhà cung cấp nữa", async () => {
    vi.stubEnv("AI_TIMEOUT_MS", "50");
    fakeAi.reply(async () => {
      await new Promise((r) => setTimeout(r, 80));
      return { title: 1 };
    });
    await expect(ask({ prompt, input: { topic: "x" } })).rejects.toEqual(new UserError(AI_UNAVAILABLE));
    expect(fakeAi.calls()).toHaveLength(1);
  });

  it("nhà không đọc ảnh, không tìm web, không đọc video thì ghi skipped, không ném lỗi", async () => {
    fakeAi.supports({ images: false, webSearch: false, video: false });
    fakeAi.reply(() => ({ title: "Chỉ chữ" }));
    const res = await ask({
      prompt,
      input: { topic: "x" },
      images: ["https://cf.shopee.vn/a.jpg"],
      webSearch: true,
      videoUrl: "https://www.tiktok.com/@a/video/1",
    });
    expect(res).toEqual({ data: { title: "Chỉ chữ" }, skipped: ["video", "images", "webSearch"] });
    expect(fakeAi.calls()[0]).toMatchObject({ images: [], webSearch: false });
  });

  it("tìm web trả nguồn đã lọc: bỏ URL sai, trùng, không phải http(s)", async () => {
    fakeAi.reply((req) => {
      expect(req.jsonSchema).toMatchObject({ required: ["data", "sources"] });
      return {
        data: { title: "Có nguồn" },
        sources: [
          { url: "https://vi.wikipedia.org/wiki/A", title: " Wiki " },
          { url: "https://vi.wikipedia.org/wiki/A", title: "Trùng" },
          { url: "javascript:alert(1)", title: "x" },
          { url: "không phải url", title: "y" },
          { url: "https://example.com/b", title: "" },
        ],
      };
    });
    const res = await ask({ prompt, input: { topic: "x" }, webSearch: true });
    expect(res).toEqual({
      data: { title: "Có nguồn" },
      sources: [
        { url: "https://vi.wikipedia.org/wiki/A", title: "Wiki" },
        { url: "https://example.com/b", title: "example.com" },
      ],
      skipped: [],
    });
  });

  it("tìm web không ra nguồn nào thì skipped có webSearch", async () => {
    fakeAi.reply(() => ({ data: { title: "Không nguồn" }, sources: [] }));
    const res = await ask({ prompt, input: { topic: "x" }, webSearch: true });
    expect(res.skipped).toEqual(["webSearch"]);
  });

  it("AI_PROVIDERS có tên lạ thì báo lỗi cấu hình (fail closed)", async () => {
    vi.stubEnv("AI_PROVIDERS", "openai");
    await expect(ask({ prompt, input: { topic: "x" } })).rejects.toBeInstanceOf(UserError);
  });
});
