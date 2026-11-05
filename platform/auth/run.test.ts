import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserError } from "@/platform/errors";

const auth = vi.hoisted(() => ({ header: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(auth.header ? { authorization: auth.header } : {}),
}));

const { run } = await import("@/platform/auth/run");

const basic = (s: string) => `Basic ${Buffer.from(s).toString("base64")}`;

describe("run", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_USERNAME", "admin");
    vi.stubEnv("ADMIN_PASSWORD", "mat-khau");
    auth.header = basic("admin:mat-khau");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("trả ok kèm dữ liệu khi đã đăng nhập", async () => {
    expect(await run(async () => ({ id: "1" }))).toEqual({ ok: true, id: "1" });
  });

  it("không có header thì báo cần đăng nhập, không chạy hàm", async () => {
    auth.header = null;
    const fn = vi.fn(async () => ({}));
    const res = await run(fn);
    expect(res).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
    expect(fn).not.toHaveBeenCalled();
    expect(JSON.stringify(res)).not.toContain("Unauthorized");
  });

  it("sai mật khẩu thì báo cần đăng nhập", async () => {
    auth.header = basic("admin:sai");
    expect(await run(async () => ({}))).toEqual({ ok: false, error: "Bạn cần đăng nhập CMS" });
  });

  it("UserError giữ nguyên thông báo tiếng Việt", async () => {
    const res = await run(async () => {
      throw new UserError("Không tìm thấy bài viết");
    });
    expect(res).toEqual({ ok: false, error: "Không tìm thấy bài viết" });
  });

  it("lỗi bất ngờ trả thông báo chung và ghi log phía server", async () => {
    const err = new Error("PrismaClientKnownRequestError: No record was found");
    const res = await run(async () => {
      throw err;
    });
    expect(res).toEqual({ ok: false, error: "Có lỗi xảy ra, thử lại sau" });
    expect(console.error).toHaveBeenCalledWith(err);
  });
});
