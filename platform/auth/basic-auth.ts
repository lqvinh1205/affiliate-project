import { createHash, timingSafeEqual } from "node:crypto";

const digest = (s: string) => createHash("sha256").update(s).digest();

// Kiểm tra header "Authorization: Basic ..." với ADMIN_USERNAME/ADMIN_PASSWORD.
// Thiếu biến môi trường → luôn từ chối (fail closed).
export function isAuthorized(authHeader: string | null): boolean {
  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass || !authHeader?.startsWith("Basic ")) return false;
  const given = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
  return timingSafeEqual(digest(given), digest(`${user}:${pass}`));
}
