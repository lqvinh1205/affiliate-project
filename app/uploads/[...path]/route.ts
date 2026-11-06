import { openStoredFile } from "@/platform/storage/local-disk";
import { parseByteRange } from "@/platform/storage/range";

// Phục vụ file upload từ `UPLOAD_DIR` (Story 2.8 chốt route handler, không qua `public/`): chỉ nhận một
// đoạn tên dạng sha256 + đuôi (`..` và đường dẫn con → 404). Tên theo nội dung nên cache vĩnh viễn được.
// Nhận `Range` một khoảng → 206 (Safari trên iPhone cần để phát video Cảm hứng); khoảng ngoài file → 416.
export async function GET(request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path } = await ctx.params;
  const file = path.length === 1 ? await openStoredFile(path[0]) : null;
  if (!file) return new Response("Không tìm thấy", { status: 404 });
  const headers = {
    "Content-Type": file.type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  const range = parseByteRange(request.headers.get("range"), file.size);
  if (range === "unsatisfiable") {
    return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${file.size}` } });
  }
  if (range) {
    return new Response(file.read(range.start, range.end), {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(range.end - range.start + 1),
        "Content-Range": `bytes ${range.start}-${range.end}/${file.size}`,
      },
    });
  }
  return new Response(file.read(), { headers: { ...headers, "Content-Length": String(file.size) } });
}
