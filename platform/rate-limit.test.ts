import { describe, expect, it } from "vitest";
import { clientKey, createRateLimiter } from "@/platform/rate-limit";

describe("createRateLimiter", () => {
  it("cho tối đa `limit` lần trong một cửa sổ, sang cửa sổ mới thì đếm lại", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.hit("a", 0)).toBe(true);
    expect(limiter.hit("a", 10)).toBe(true);
    expect(limiter.hit("a", 20)).toBe(false);
    expect(limiter.hit("b", 20)).toBe(true);
    expect(limiter.hit("a", 1000)).toBe(true);
  });
});

describe("clientKey", () => {
  it("băm IP đầu của x-forwarded-for, không chứa IP gốc", () => {
    const key = clientKey(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }));
    expect(key).not.toContain("203.0.113.5");
    expect(key).toBe(clientKey(new Headers({ "x-real-ip": "203.0.113.5" })));
    expect(key).not.toBe(clientKey(new Headers({ "x-forwarded-for": "203.0.113.6" })));
  });

  it("thiếu header IP thì dùng chung một khoá", () => {
    expect(clientKey(new Headers())).toBe(clientKey(new Headers()));
  });
});
