import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { put } from "@/platform/storage/local-disk";
import { GET } from "@/app/uploads/[...path]/route";

let dir = "";
let name = "";

beforeEach(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "uploads-route-"));
  vi.stubEnv("UPLOAD_DIR", dir);
  const body = new Blob([new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])]).stream();
  name = (await put({ type: "video/mp4", body }, 100)).url.slice("/uploads/".length);
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});

const get = (headers: Record<string, string> = {}, p = [name]) =>
  GET(new Request(`http://localhost/uploads/${p.join("/")}`, { headers }), { params: Promise.resolve({ path: p }) });

describe("GET /uploads/[...path]", () => {
  it("không Range → 200 cả file, báo Accept-Ranges", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(res.headers.get("content-length")).toBe("10");
    expect(new Uint8Array(await res.arrayBuffer()).length).toBe(10);
  });

  it("Range một khoảng → 206 với Content-Range và đúng đoạn byte (video trên iPhone)", async () => {
    const res = await get({ range: "bytes=2-4" });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 2-4/10");
    expect(res.headers.get("content-length")).toBe("3");
    expect([...new Uint8Array(await res.arrayBuffer())]).toEqual([2, 3, 4]);
  });

  it("Range ngoài file → 416", async () => {
    const res = await get({ range: "bytes=10-" });
    expect(res.status).toBe(416);
    expect(res.headers.get("content-range")).toBe("bytes */10");
  });

  it("tên sai dạng → 404", async () => {
    expect((await get({}, ["..", "x"])).status).toBe(404);
  });
});
