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

  it("đầy `maxKeys` thì bỏ khoá cũ nhất, các khoá còn lại vẫn giữ số đếm", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    expect(limiter.hit("a", 0)).toBe(true);
    expect(limiter.hit("b", 1)).toBe(true);
    expect(limiter.hit("c", 2)).toBe(true); // bỏ "a"
    expect(limiter.hit("b", 3)).toBe(false);
    expect(limiter.hit("c", 4)).toBe(false);
    expect(limiter.hit("a", 5)).toBe(true); // "a" đã bị bỏ → đếm lại; bỏ "b"
    expect(limiter.hit("c", 6)).toBe(false);
  });

  it("khoá mở cửa sổ mới tính là mới nhất khi chọn khoá bỏ", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 100, maxKeys: 2 });
    limiter.hit("a", 0);
    limiter.hit("b", 50);
    expect(limiter.hit("a", 120)).toBe(true); // cửa sổ mới của "a"; "b" giờ là khoá cũ nhất
    expect(limiter.hit("c", 121)).toBe(true); // bỏ "b"
    expect(limiter.hit("a", 122)).toBe(false);
  });
});

describe("clientKey", () => {
  it("băm IP cuối của x-forwarded-for (do proxy nối), không chứa IP gốc", () => {
    const key = clientKey(new Headers({ "x-forwarded-for": "10.0.0.1, 203.0.113.5" }));
    expect(key).not.toContain("203.0.113.5");
    expect(key).toBe(clientKey(new Headers({ "x-forwarded-for": "203.0.113.5" })));
    expect(key).not.toBe(clientKey(new Headers({ "x-forwarded-for": "203.0.113.6" })));
  });

  it("mục đầu x-forwarded-for do client giả không đổi khoá", () => {
    const real = clientKey(new Headers({ "x-forwarded-for": "203.0.113.5" }));
    expect(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.5" }))).toBe(real);
    expect(clientKey(new Headers({ "x-forwarded-for": "9.9.9.9, 203.0.113.5" }))).toBe(real);
  });

  it("không đọc x-real-ip; thiếu header IP thì dùng chung một khoá", () => {
    expect(clientKey(new Headers({ "x-real-ip": "203.0.113.5" }))).toBe(clientKey(new Headers()));
    expect(clientKey(new Headers())).toBe(clientKey(new Headers()));
  });
});
