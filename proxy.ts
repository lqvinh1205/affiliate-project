import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/platform/auth/basic-auth";

export function proxy(request: NextRequest) {
  if (isAuthorized(request.headers.get("authorization"))) return NextResponse.next();
  return new NextResponse("Cần đăng nhập", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CMS", charset="UTF-8"' },
  });
}

export const config = {
  // /cms/upload nằm ngoài proxy (proxy chỉ đệm body 10 MB): route đó tự gọi requireAdmin() — spine AD-24.
  matcher: ["/cms", "/cms/((?!upload$).*)", "/api/:path*"],
};
