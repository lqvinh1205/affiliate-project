import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAuthorized } from "@/platform/auth/basic-auth";

const basic = (s: string) => `Basic ${Buffer.from(s).toString("base64")}`;

describe("isAuthorized", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_USERNAME", "admin");
    vi.stubEnv("ADMIN_PASSWORD", "mat-khau");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("nhận đúng tài khoản và mật khẩu", () => {
    expect(isAuthorized(basic("admin:mat-khau"))).toBe(true);
  });

  it("từ chối khi thiếu ADMIN_USERNAME", () => {
    vi.stubEnv("ADMIN_USERNAME", "");
    expect(isAuthorized(basic(":mat-khau"))).toBe(false);
  });

  it("từ chối khi thiếu ADMIN_PASSWORD", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(isAuthorized(basic("admin:"))).toBe(false);
  });

  it("từ chối khi không có header", () => {
    expect(isAuthorized(null)).toBe(false);
  });

  it("từ chối header không bắt đầu bằng Basic", () => {
    expect(isAuthorized(Buffer.from("admin:mat-khau").toString("base64"))).toBe(false);
    expect(isAuthorized(`Bearer ${Buffer.from("admin:mat-khau").toString("base64")}`)).toBe(false);
  });

  it("từ chối sai mật khẩu", () => {
    expect(isAuthorized(basic("admin:sai"))).toBe(false);
  });
});
