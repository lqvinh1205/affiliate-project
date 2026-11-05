import { headers } from "next/headers";
import { isAuthorized } from "@/platform/auth/basic-auth";
import { UserError } from "@/platform/errors";

// Server Action có thể bị gọi trực tiếp bằng POST → phải tự kiểm tra lại, không dựa vào proxy.
export async function requireAdmin() {
  if (!isAuthorized((await headers()).get("authorization"))) {
    throw new UserError("Bạn cần đăng nhập CMS");
  }
}
