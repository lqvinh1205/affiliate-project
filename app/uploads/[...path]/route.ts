import { openStoredFile } from "@/platform/storage/local-disk";

// Phục vụ file upload từ `UPLOAD_DIR` (Story 2.8 chốt route handler, không qua `public/`): chỉ nhận một
// đoạn tên dạng sha256 + đuôi (`..` và đường dẫn con → 404). Tên theo nội dung nên cache vĩnh viễn được.
export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path } = await ctx.params;
  const file = path.length === 1 ? await openStoredFile(path[0]) : null;
  if (!file) return new Response("Không tìm thấy", { status: 404 });
  return new Response(file.stream, {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
