# Lớp AI

> Phiên bản: `openai` 7.47 (hiện tại, sẽ bỏ) · Nguồn: `lib/ai.ts`, `app/cms/actions.ts`, `~/Downloads/llm.ts` (tham khảo cho lớp mới), PRD NFR-1/NFR-2/NFR-9, `addendum.md` A1/A3 · Kiểm lần cuối: 2026-11-03 @ dfd7e8f

## Tóm tắt cho agent

- **Hiện tại** mọi lời gọi AI nằm trong `lib/ai.ts`, dùng OpenAI Responses API với structured output (`responses.parse` + `zodTextFormat`).
- **Quyết định đã chốt:** bỏ OpenAI (`[QD-09]`), ngân sách 0đ (`[QD-10]`). Lớp mới dùng nhiều nhà cung cấp, tự chuyển nhà khi lỗi. Phương án cụ thể do `bmad-architecture` chọn.
- Tính năng **không bao giờ** gọi SDK hay `fetch` tới nhà cung cấp AI trực tiếp; luôn đi qua hàm của lớp AI.
- Output AI luôn được validate bằng schema Zod trước khi dùng, và HTML luôn qua `sanitizePostHtml`.
- Lời gọi AI chỉ chạy ở server (Server Action hoặc module server), sau `requireAdmin()`.
- Lỗi AI trả về cho Vinh bằng thông báo tiếng Việt; không làm mất dữ liệu đã nhập.

## Khái niệm cốt lõi

- **Structured output:** AI trả về JSON theo một schema. Với OpenAI, server ép schema. Với các nhà cung cấp OpenAI-compatible miễn phí, chỉ có `response_format: { type: "json_object" }` — JSON hợp lệ nhưng **không** đảm bảo đúng schema, nên phải validate bằng Zod và thử lại khi sai.
- **Profile `fast` / `quality`:** việc nhẹ (gợi ý danh mục, tóm tắt) ưu tiên nhà phản hồi nhanh; việc nặng (viết bài) ưu tiên nhà viết tốt.
- **Fallback và cooldown:** một nhà lỗi, timeout hay hết hạn mức thì khoá đó nghỉ một thời gian và lời gọi chuyển sang nhà kế tiếp.

## Dự án dùng như thế nào (hiện tại)

- **[AI-01]** Một client OpenAI lười khởi tạo; thiếu `OPENAI_API_KEY` thì ném lỗi tiếng Việt — `lib/ai.ts:6-14`.
- **[AI-02]** Model đọc từ `OPENAI_MODEL`, mặc định `gpt-4o-mini` — `lib/ai.ts:16`.
- **[AI-03]** Hàm chung `ask(schema, name, system, user)` gọi `responses.parse` và trả `output_parsed` đã có kiểu — `lib/ai.ts:18-29`. Mọi tính năng AI dùng hàm này.
- **[AI-04]** Ba tính năng: `generatePost` (viết bài, prompt hệ thống `WRITER_SYSTEM` chứa giọng thương hiệu và quy chuẩn độ dài/SEO), `toThreads` (chuỗi Threads, bài cuối chứa link website — **trái PRD FR-14**, sẽ đổi), `analyzeSeo` (chấm SEO, kẹp điểm 0–100) — `lib/ai.ts`.
- **[AI-05]** Server Action gọi AI bọc trong `run()` → `requireAdmin()`, rồi sanitize HTML trả về — `app/cms/actions.ts` (`createPost`, `runSeoCheck`, `runThreads`).
- **[AI-06]** Giọng thương hiệu và quy chuẩn bài web hiện nằm trong prompt `WRITER_SYSTEM`. PRD FR-18 chuyển chúng thành giá trị khởi tạo của Hồ sơ phong cách (lưu DB, Vinh sửa được).

## Dự kiến: lớp AI đa nhà cung cấp

Tham khảo `~/Downloads/llm.ts` (402 dòng, không phụ thuộc thư viện):

- **[AI-07]** Nhà cung cấp OpenAI-compatible chat completions: Groq, Gemini, Cerebras, OpenRouter. Mỗi nhà nhiều khoá, ngăn bằng dấu phẩy trong env (`GROQ_API_KEY=k1,k2`). Model đọc từ env (`GROQ_MODEL`...), mã nguồn chỉ là giá trị dự phòng.
- **[AI-08]** `callLLM(messages, { jsonMode, maxTokens, temperature, profile, timeoutMs })` trả về chuỗi; `parseJsonFromAI<T>(text, context)` gỡ JSON bọc trong code block hoặc có newline chưa escape.
- **[AI-09]** `jsonMode` kiểm JSON ngay trong vòng thử từng nhà: nhà trả sai thì rơi sang nhà kế tiếp thay vì làm hỏng cả lời gọi. Chế độ này đòi chữ "json" có trong tin nhắn.
- **[AI-10]** Cooldown lưu trong bộ nhớ tiến trình (60s khi chạm giới hạn phút, 6h khi hết hạn mức ngày, 2 phút khi treo). Hợp với một VPS đơn; khởi động lại là xoá.
- **[AI-11]** Timeout mặc định 55s (`LLM_TIMEOUT_MS`), thấp hơn 60s mặc định của nginx để lỗi bật ra từ ứng dụng.
- **[AI-12]** Giới hạn đã biết: chỉ nhận `content: string` (chưa gửi ảnh), không tự tìm web. PRD FR-6 (tìm web) và FR-7 (đọc ảnh) cần thêm: Gemini cho ảnh, hoặc Claude CLI (`claude -p`) dùng gói thuê bao sẵn có — cần kiểm điều khoản (PRD R-5). Quyết định thuộc `bmad-architecture`.

Hình dạng hàm đề xuất để tính năng không phụ thuộc nhà cung cấp:

```ts
// lib/ai/ask.ts (dự kiến) — chữ ký giữ nguyên tinh thần ask() hiện tại
export async function ask<T extends z.ZodType>(opts: {
  schema: T;
  name: string;
  system: string;
  user: string;
  images?: string[];      // FR-7, chỉ nhà hỗ trợ ảnh nhận
  profile?: "fast" | "quality";
}): Promise<z.infer<T>>;
// Bên trong: callLLM(jsonMode) → parseJsonFromAI → schema.safeParse → sai thì thử lại 1 lần với lỗi Zod trong prompt → vẫn sai thì ném lỗi tiếng Việt.
```

## Công thức: thêm một tính năng AI

1. Định nghĩa schema Zod cho output trong module lớp AI, xuất kiểu bằng `z.infer`.
2. Viết prompt hệ thống: vai trò, quy tắc bắt buộc (`[QD-11]`), định dạng output (nhắc "JSON" khi dùng lớp mới), giới hạn độ dài. Lấy giọng văn từ Hồ sơ phong cách khi đã có (FR-18), không chép cứng.
3. Viết hàm tính năng gọi `ask(...)`; hậu xử lý số (kẹp phạm vi như `analyzeSeo`), cắt độ dài.
4. Gọi từ một Server Action bọc trong `run()`; sanitize mọi HTML trước khi trả về hoặc lưu.
5. Lưu kết quả là Gợi ý AI ở trạng thái *chờ duyệt* (FR-22) khi tính năng tạo nội dung.
6. Giao diện: hiện trạng thái đang xử lý, nút bị khoá khi chờ, lỗi hiện bằng toast tiếng Việt (NFR-3).

## Bẫy hay gặp

- **Nhà cung cấp trả văn xuôi thay vì JSON** → dặn trong prompt là chưa đủ → bật `jsonMode` và validate bằng Zod.
- **Mọi nhà cùng trả 404** → model bị khai tử → đổi biến `*_MODEL` trong `.env`, không sửa code.
- **Model có bước suy luận hết token trước khi trả lời** (gpt-oss) → token suy luận tính vào `max_tokens` → đặt `reasoning_effort: "low"` cho việc điền khuôn JSON (llm.ts đã làm).
- **Gọi AI từ Client Component** → lộ khoá → chỉ gọi ở server.
- **Tin output AI là HTML an toàn** → AI có thể sinh thẻ lạ → luôn `sanitizePostHtml`.

## Checklist khi viết workflow / review

- [ ] Không import `openai` hay SDK nhà cung cấp trong code tính năng.
- [ ] Output AI được validate bằng Zod.
- [ ] HTML từ AI đi qua `sanitizePostHtml`.
- [ ] Lời gọi AI nằm trong Server Action có `requireAdmin()`.
- [ ] Prompt có quy tắc chống bịa và tiếng Việt có dấu (`[QD-11]`).
- [ ] Lỗi AI hiện thông báo tiếng Việt; dữ liệu đã nhập không mất.
- [ ] Nội dung tạo ra lưu ở trạng thái *chờ duyệt*.
- [ ] Biến môi trường AI mới có trong `.env.example`.

## Tham khảo

- `lib/ai.ts`, `app/cms/actions.ts`
- `~/Downloads/llm.ts`
- `_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/addendum.md` A1, A3
