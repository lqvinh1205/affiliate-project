import { headers } from "next/headers";
import { isAuthorized } from "@/lib/auth";

// Server Action có thể bị gọi trực tiếp bằng POST → phải tự kiểm tra lại, không dựa vào proxy.
export async function requireAdmin() {
  if (!isAuthorized((await headers()).get("authorization"))) {
    throw new Error("Unauthorized");
  }
}
