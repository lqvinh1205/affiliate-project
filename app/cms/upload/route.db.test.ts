import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actionTest, resetTestDb } from "@/vitest.db.helpers";
import { IMAGE_MAX_BYTES } from "@/platform/upload-rules";
import { POST } from "@/app/cms/upload/route";

// Route upload (AD-24) chạy thật với khung test của `vitest.db.mocks.ts` (header Basic Auth trong `actionTest`).
// Không chạm DB; nằm trong `test:db` để dùng mock `next/headers`.

let dir = "";

function upload(body: BodyInit | null, headers: Record<string, string>) {
  return POST(
    new Request("http://localhost/cms/upload", { method: "POST", headers, body, duplex: "half" } as RequestInit),
  );
}

// Luồng không khai báo Content-Length, dài `bytes` byte.
function stream(bytes: number, chunk = 1024 * 1024) {
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= bytes) return controller.close();
      const n = Math.min(chunk, bytes - sent);
      sent += n;
      controller.enqueue(new Uint8Array(n));
    },
  });
}

beforeEach(async () => {
  await resetTestDb();
  dir = mkdtempSync(path.join(tmpdir(), "upload-route-"));
  vi.stubEnv("UPLOAD_DIR", dir);
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});

describe("POST /cms/upload", () => {
  it("chưa đăng nhập: 401 + WWW-Authenticate cùng realm proxy, không lưu", async () => {
    actionTest.authorization = null;
    const res = await upload(new Uint8Array([1]), { "content-type": "image/png" });
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toBe('Basic realm="CMS", charset="UTF-8"');
    expect(readdirSync(dir)).toEqual([]);
  });

  it("SVG bị từ chối 415", async () => {
    const res = await upload("<svg/>", { "content-type": "image/svg+xml" });
    expect(res.status).toBe(415);
    expect((await res.json()).ok).toBe(false);
  });

  it("Content-Length vượt giới hạn: 413 trước khi đọc body", async () => {
    const res = await upload(stream(10), { "content-type": "image/jpeg", "content-length": String(IMAGE_MAX_BYTES + 1) });
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ ok: false, error: "Ảnh tối đa 25 MB" });
  });

  it("không có Content-Length mà luồng vượt giới hạn: 413, không để lại file", async () => {
    const res = await upload(stream(IMAGE_MAX_BYTES + 1), { "content-type": "image/jpeg" });
    expect(res.status).toBe(413);
    expect(readdirSync(dir)).toEqual([]);
  });

  it("file rỗng: 400, không lưu file 0 byte", async () => {
    const res = await upload(stream(0), { "content-type": "image/png" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "File rỗng, chọn file khác" });
    expect(readdirSync(dir)).toEqual([]);
  });

  it("ảnh hợp lệ: 200, URL /uploads/<sha256>.<đuôi>", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const sha = createHash("sha256").update(bytes).digest("hex");
    const res = await upload(bytes, { "content-type": "image/webp" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, url: `/uploads/${sha}.webp` });
    expect(readdirSync(dir)).toEqual([`${sha}.webp`]);
  });
});
