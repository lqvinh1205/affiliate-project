import { execFileSync } from "node:child_process";
import { Client } from "pg";

// Chỉ chạy trên Postgres cục bộ của docker compose, database tên kết thúc `_test` ([QD-07]).
function testDatabaseUrl() {
  const raw = process.env.TEST_DATABASE_URL;
  if (!raw) throw new Error("Thiếu TEST_DATABASE_URL (xem .env.example).");
  const url = new URL(raw);
  const name = url.pathname.slice(1);
  const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!localHost || url.port !== "54329" || !name.endsWith("_test")) {
    throw new Error(
      "TEST_DATABASE_URL phải là localhost/127.0.0.1 cổng 54329 và tên database kết thúc bằng _test; từ chối chạy.",
    );
  }
  return { url, name };
}

async function ensureDatabase(url: URL, name: string) {
  const admin = new URL(url);
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (!rowCount) await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
  } finally {
    await client.end();
  }
}

export default async function setup() {
  const { url, name } = testDatabaseUrl();
  await ensureDatabase(url, name);
  // Áp migration còn thiếu (không xoá DB: mỗi file test tự TRUNCATE trước từng test).
  // DIRECT_URL để trống: prisma.config.ts rơi về DATABASE_URL (DB test), không dùng giá trị trong .env.
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: "" },
  });
}
