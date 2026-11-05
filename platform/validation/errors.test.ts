import { describe, expect, it } from "vitest";
import { z } from "zod";
import { firstError } from "@/platform/validation/errors";

describe("firstError", () => {
  it("trả thông báo của lỗi đầu tiên", () => {
    const r = z.object({ a: z.string().min(1, "Thiếu a"), b: z.string().min(1, "Thiếu b") }).safeParse({ a: "", b: "" });
    expect(r.success).toBe(false);
    expect(firstError(r.error!)).toBe("Thiếu a");
  });
});
