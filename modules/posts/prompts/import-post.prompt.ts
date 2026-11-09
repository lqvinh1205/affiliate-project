import { z } from "zod";
import type { PromptDef } from "@/platform/ai/ask";
import { visibleText } from "@/platform/html/content";
import { sanitizePostHtml } from "@/platform/html/sanitize";
import {
  POST_CONTENT_MAX,
  POST_EXCERPT_MAX,
  POST_IMPORT_IMAGES_MAX,
  POST_TITLE_MAX,
} from "@/modules/posts/constants";

// Nhập Bài web từ URL (FR-39; ngoại lệ AD-9: `posts.importPostFromUrl` trả nội dung cho form, không lưu, không qua
// Duyệt). Máy chủ không tự tải trang: URL chỉ nằm trong prompt, nhà AI đọc trang bằng công cụ web (`webSearch`).
// Không dùng Hồ sơ phong cách — chép nguyên văn; viết lại là việc của `rewrite-post`.

export type ImportPostPromptInput = { url: string };

// Kết quả AI (không transform: sinh JSON Schema cho nhà cung cấp).
const importPostOutputSchema = z.object({
  readable: z.boolean(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  imageUrls: z.array(z.string()),
});

export type ImportPostOutput = z.infer<typeof importPostOutputSchema>;

export const importPostPrompt: PromptDef<ImportPostPromptInput, typeof importPostOutputSchema> = {
  id: "posts.import-post",
  version: 1,
  profile: "fast",
  output: importPostOutputSchema,
  system: () => `Bạn giúp biên tập viên lấy nội dung một bài viết trên trang web khác để làm tư liệu.
- Đọc trực tiếp trang theo đúng URL được cho bằng công cụ đọc trang web (không tìm trang khác thay thế).
- Chép NGUYÊN VĂN thân bài: không tóm tắt, không viết lại, không dịch, không viết thêm. Bỏ menu, quảng cáo, bình luận, phần chia sẻ, bài liên quan, chân trang.
- "title": tiêu đề bài. "excerpt": đoạn mô tả/sapo của bài nếu có, không có thì chép câu mở đầu.
- "content" là HTML chỉ dùng các thẻ h2, h3, p, ul, ol, li, strong, em, blockquote. Không h1, không link, không ảnh.
- "imageUrls": URL đầy đủ (http/https) của các ảnh nằm trong thân bài, theo thứ tự xuất hiện; không có thì mảng rỗng.
- Trang cần đăng nhập, bị chặn, trống hoặc không đọc được thân bài thì "readable": false và các trường khác để trống.`,
  user: (input) => `URL bài viết cần đọc: ${input.url}`,
};

const clip = (s: string, max: number) => s.trim().slice(0, max);

// Link ảnh hợp lệ: http(s), không trùng, tối đa `POST_IMPORT_IMAGES_MAX`.
function cleanImageUrls(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    try {
      const url = new URL(raw.trim());
      if (!/^https?:$/.test(url.protocol) || seen.has(url.href)) continue;
      seen.add(url.href);
      out.push(url.href);
    } catch {
      continue;
    }
  }
  return out.slice(0, POST_IMPORT_IMAGES_MAX);
}

// Kết quả AI → giá trị điền form: HTML qua `sanitizePostHtml` (AD-22 — bỏ link, ảnh), cắt về giới hạn cứng.
// Trang không đọc được hoặc thân bài sau lọc rỗng → `null` (action báo IMPORT_UNREADABLE).
export function toImportedPost(out: ImportPostOutput) {
  if (!out.readable) return null;
  const content = sanitizePostHtml(out.content).slice(0, POST_CONTENT_MAX);
  if (!visibleText(content)) return null;
  return {
    title: clip(out.title, POST_TITLE_MAX) || "Bài viết mới",
    excerpt: clip(out.excerpt, POST_EXCERPT_MAX),
    content,
    imageUrls: cleanImageUrls(out.imageUrls),
  };
}
