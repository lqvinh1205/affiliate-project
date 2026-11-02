import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Chưa cấu hình OPENAI_API_KEY trong .env");
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const model = () => process.env.OPENAI_MODEL || "gpt-4o-mini";

async function ask<T extends z.ZodType>(schema: T, name: string, system: string, user: string) {
  const res = await getClient().responses.parse({
    model: model(),
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    text: { format: zodTextFormat(schema, name) },
  });
  if (!res.output_parsed) throw new Error("AI không trả về kết quả hợp lệ, hãy thử lại");
  return res.output_parsed as z.infer<T>;
}

// ---------- Sinh bài viết ----------

export type ProductInput = { name: string; price?: string | null };

export const postDraftSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  seoKeywords: z.array(z.string()),
});
export type PostDraft = z.infer<typeof postDraftSchema>;

const WRITER_SYSTEM = `Bạn là biên tập viên của trang "Mẹo Vặt Cuộc Sống" — tạp chí đời sống cho người Việt.
Văn phong: gần gũi, dí dỏm vừa phải kiểu Gen-Z nhưng rõ ràng, hữu ích, không sến, không phóng đại.
Quy tắc bắt buộc:
- Viết tiếng Việt có dấu chuẩn.
- Không bịa số liệu, giá, công dụng y khoa/mỹ phẩm tuyệt đối; với làm đẹp/sức khỏe thêm lưu ý thử trước hoặc hỏi chuyên gia.
- "content" là HTML chỉ dùng các thẻ: h2, h3, p, ul, ol, li, strong, em, blockquote. Không dùng h1, không chèn link, ảnh hay giá — sản phẩm được hiển thị riêng bên dưới bài.
- Dài khoảng 600–900 từ, 3–5 mục h2, mở bài 1–2 đoạn ngắn đi thẳng vào vấn đề.
- Lồng ghép sản phẩm tự nhiên như một gợi ý hữu ích, không quảng cáo lộ liễu.
- "title" ≤ 70 ký tự, hấp dẫn nhưng không giật tít; "seoTitle" ≤ 60 ký tự; "seoDescription" 140–160 ký tự; "excerpt" 1–2 câu (≤ 200 ký tự).
- "tags": 3–5 tag ngắn viết thường; "seoKeywords": 3–6 cụm từ khóa người Việt hay tìm.`;

export async function generatePost(input: {
  category: CategoryKey;
  topic?: string | null;
  products: ProductInput[];
}): Promise<PostDraft> {
  const products = input.products
    .map((p, i) => `${i + 1}. ${p.name}${p.price ? ` (giá tham khảo: ${p.price})` : ""}`)
    .join("\n");
  const kind =
    input.category === "MEO_VAT"
      ? "bài MẸO VẶT: trọng tâm là cách làm/mẹo thực tế từng bước, sản phẩm chỉ là công cụ hỗ trợ"
      : "bài GOM LINK: tổng hợp/review ngắn từng sản phẩm, mỗi sản phẩm một mục h2 hoặc h3 nêu điểm hay và hợp với ai";
  return ask(
    postDraftSchema,
    "post_draft",
    WRITER_SYSTEM,
    `Chuyên mục: ${CATEGORIES[input.category].label}. Hãy viết ${kind}.
${input.topic ? `Chủ đề/ý tưởng: ${input.topic}\n` : ""}Sản phẩm cần lồng ghép:
${products}`,
  );
}

// ---------- Chuyển thành chuỗi Threads ----------

export const threadsSchema = z.object({ posts: z.array(z.string()) });

export async function toThreads(input: { title: string; content: string; url: string }) {
  const { posts } = await ask(
    threadsSchema,
    "threads_chain",
    `Bạn là chuyên gia viết chuỗi bài Threads/Facebook kéo người đọc về website.
- Chia thành 4–7 bài trong chuỗi, mỗi bài dưới 250 ký tự, câu ngắn, có emoji làm điểm nhấn vừa phải.
- Bài 1 là "hook" gây tò mò. Các bài giữa đưa giá trị thật (mẹo/điểm hay), không tiết lộ hết.
- Bài cuối là lời kêu gọi đọc chi tiết, chứa nguyên văn đường link được cung cấp.
- Viết tiếng Việt có dấu, giọng gần gũi Gen-Z, không giật tít sai sự thật.`,
    `Tiêu đề: ${input.title}
Link bài viết: ${input.url}
Nội dung (HTML):
${input.content}`,
  );
  return posts;
}

// ---------- Chấm điểm SEO ----------

export const seoReportSchema = z.object({
  score: z.number(),
  suggestions: z.array(z.string()),
});
export type SeoReport = z.infer<typeof seoReportSchema>;

export async function analyzeSeo(input: {
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  content: string;
  keywords: string[];
}): Promise<SeoReport> {
  const report = await ask(
    seoReportSchema,
    "seo_report",
    `Bạn là chuyên gia SEO on-page cho website tiếng Việt. Chấm bài viết trên thang 0–100 dựa trên:
từ khóa ở tiêu đề/đoạn đầu/heading, độ dài và cấu trúc heading, meta title (≤60 ký tự) và meta description (140–160 ký tự),
độ dễ đọc, tính hữu ích và trải nghiệm người đọc. Trả về "suggestions" là 3–6 gợi ý cụ thể, có thể làm ngay, viết tiếng Việt.`,
    `Từ khóa mục tiêu: ${input.keywords.join(", ") || "(chưa có)"}
Tiêu đề: ${input.title}
Meta title: ${input.seoTitle || "(trống)"}
Meta description: ${input.seoDescription || "(trống)"}
Nội dung (HTML):
${input.content}`,
  );
  return { ...report, score: Math.max(0, Math.min(100, Math.round(report.score))) };
}
