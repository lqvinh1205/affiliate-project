import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyUploadError, openStoredFile, put, uploadDir, UploadTooLargeError } from "@/platform/storage/local-disk";

let dir = "";

function streamOf(bytes: Uint8Array, chunk = 1024 * 1024) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunk) controller.enqueue(bytes.subarray(i, i + chunk));
      controller.close();
    },
  });
}

async function readAll(stream: ReadableStream<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (let r = await reader.read(); !r.done; r = await reader.read()) chunks.push(r.value);
  return Buffer.concat(chunks);
}

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "uploads-test-"));
  vi.stubEnv("UPLOAD_DIR", dir);
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});

describe("put", () => {
  it("lưu ảnh 12 MB nguyên vẹn, tên = sha256 + đuôi theo loại, trả URL /uploads/", async () => {
    const bytes = new Uint8Array(12 * 1024 * 1024).map((_, i) => i % 251);
    const sha = createHash("sha256").update(bytes).digest("hex");

    const { url } = await put({ type: "image/jpeg", body: streamOf(bytes) }, 25 * 1024 * 1024);

    expect(url).toBe(`/uploads/${sha}.jpg`);
    const saved = readFileSync(path.join(dir, `${sha}.jpg`));
    expect(createHash("sha256").update(saved).digest("hex")).toBe(sha);
    expect(readdirSync(dir)).toEqual([`${sha}.jpg`]);
  });

  it("vượt giới hạn thì ném UploadTooLargeError và không để lại file", async () => {
    await expect(put({ type: "video/mp4", body: streamOf(new Uint8Array(2048), 512) }, 1000)).rejects.toBeInstanceOf(
      UploadTooLargeError,
    );
    expect(readdirSync(dir)).toEqual([]);
  });
});

describe("uploadDir", () => {
  it("thiếu UPLOAD_DIR thì ném lỗi (fail closed)", () => {
    vi.stubEnv("UPLOAD_DIR", "");
    expect(() => uploadDir()).toThrow(/UPLOAD_DIR/);
  });

  it.each(["public/uploads", ".next/uploads", "public"])("từ chối thư mục trong public/ hoặc .next/: %s", (p) => {
    vi.stubEnv("UPLOAD_DIR", p);
    expect(() => uploadDir()).toThrow(/không được nằm trong/);
  });
});

describe("openStoredFile", () => {
  it("mở file đã lưu với đúng loại và dung lượng", async () => {
    const { url } = await put({ type: "image/png", body: streamOf(new Uint8Array([1, 2, 3])) }, 100);
    const file = await openStoredFile(url.slice("/uploads/".length));
    expect(file).toMatchObject({ type: "image/png", size: 3 });
    expect([...(await readAll(file!.stream))]).toEqual([1, 2, 3]);
  });

  it.each(["..", "../etc/passwd", "a.png", `${"a".repeat(64)}.exe`, `${"a".repeat(64)}.png/..`, ".tmp-x"])(
    "tên không hợp lệ %s trả null",
    async (name) => {
      expect(await openStoredFile(name)).toBeNull();
    },
  );

  it("tên hợp lệ nhưng không có file trả null", async () => {
    expect(await openStoredFile(`${"a".repeat(64)}.png`)).toBeNull();
  });
});

describe("put rỗng", () => {
  it("luồng 0 byte ném EmptyUploadError và không để lại file", async () => {
    await expect(put({ type: "image/png", body: streamOf(new Uint8Array(0)) }, 100)).rejects.toBeInstanceOf(
      EmptyUploadError,
    );
    expect(readdirSync(dir)).toEqual([]);
  });
});
