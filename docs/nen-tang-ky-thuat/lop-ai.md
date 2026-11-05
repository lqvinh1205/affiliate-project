# Lớp AI

> Phiên bản: `openai` 7.47 (hiện tại, sẽ bỏ) · Nguồn: `lib/ai.ts`, `app/cms/actions.ts`, `~/Downloads/llm.ts` (tham khảo cho lớp mới), PRD NFR-1/NFR-2/NFR-9, `addendum.md` A1/A3 · Kiểm lần cuối: 2026-11-05 @ 8771851

## Tóm tắt cho agent

- **Hiện tại** mọi lời gọi AI nằm trong `lib/ai.ts` (code cũ chờ chuyển: phần gọi nhà cung cấp → `platform/ai`, prompt → `modules/<miền>/prompts/` — spine AD-10, `docs/cong-thuc/chuyen-code-cu.md`), dùng OpenAI Responses API với structured output (`responses.parse` + `zodTextFormat`).
- **Quyết định đã chốt:** bỏ OpenAI (`[QD-09]`), ngân sách 0đ (`[QD-10]`). Lớp mới đặt ở `platform/ai` (đích, chưa có — dựng ở story AI đầu tiên). Nhà chính đã chốt tạm (Vinh 2026-11-05): Claude Code CLI chạy không giao diện (`claude -p`) trên máy chủ; nhà dự phòng nằm trong mục Deferred của spine. Quy tắc theo spine AD-9, AD-10, AD-18; công thức ở `docs/cong-thuc/them-tinh-nang-ai.md`.
- Gợi ý AI chỉ được tạo bởi `modules/suggestions/actions.ts`, gọi AI trong `after()` (AD-9, AD-18); ngoại lệ duy nhất là chấm SEO `posts.checkPostSeo` (không lưu, không qua Duyệt).
- Tính năng **không bao giờ** gọi SDK hay `fetch` tới nhà cung cấp AI trực tiếp; luôn đi qua hàm của lớp AI.
- Output AI luôn được validate bằng schema Zod trước khi dùng, và HTML luôn qua `sanitizePostHtml`.
- Lời gọi AI chỉ chạy ở server (Server Action hoặc module server), sau `requireAdmin()`.
- Lỗi AI trả về cho Vinh bằng thông báo tiếng Việt; không làm mất dữ liệu đã nhập.

## Khái niệm cốt lõi

- **Structured output:** AI trả về JSON theo một schema. Với OpenAI, server ép schema. Với các nhà cung cấp OpenAI-compatible miễn phí, chỉ có `response_format: { type: "json_object" }` — JSON hợp lệ nhưng **không** đảm bảo đúng schema, nên phải validate bằng Zod và thử lại khi sai.
- **Profile `fast` / `quality`:** việc nhẹ (gợi ý danh mục, tóm tắt) ưu tiên nhà phản hồi nhanh; việc nặng (viết bài) ưu tiên nhà viết tốt.
- **Fallback và cooldown** (chỉ khi có nhà dự phòng — spine Deferred): một nhà lỗi, timeout hay hết hạn mức thì khoá đó nghỉ một thời gian và lời gọi chuyển sang nhà kế tiếp.

## Dự án dùng như thế nào (hiện tại)

- **[AI-01]** Một client OpenAI lười khởi tạo; thiếu `OPENAI_API_KEY` thì ném `UserError` tiếng Việt — `lib/ai.ts:6-15`.
- **[AI-02]** Model đọc từ `OPENAI_MODEL`, mặc định `gpt-4o-mini` — `lib/ai.ts:17`.
- **[AI-03]** Hàm chung `ask(schema, name, system, user)` gọi `responses.parse` và trả `output_parsed` đã có kiểu — `lib/ai.ts:19-30`. Mọi tính năng AI dùng hàm này.
- **[AI-04]** Ba tính năng: `generatePost` (viết bài, prompt hệ thống `WRITER_SYSTEM` chứa giọng thương hiệu và quy chuẩn độ dài/SEO), `toThreads` (chuỗi Threads, bài cuối chứa link website — **trái PRD FR-14**, sẽ đổi), `analyzeSeo` (chấm SEO, kẹp điểm 0–100) — `lib/ai.ts`.
- **[AI-05]** Server Action gọi AI bọc trong `run()` (`platform/auth/run.ts`) → `requireAdmin()`; bản nháp AI qua cùng `postInputSchema` với bài viết tay rồi sanitize HTML — `app/cms/actions.ts` (`createPost`, `runSeoCheck`, `runThreads`). `maxDuration = 120` ở `app/cms/layout.tsx:11` (AD-18).
- **[AI-06]** Giọng thương hiệu và quy chuẩn bài web hiện nằm trong prompt `WRITER_SYSTEM`. PRD FR-18 chuyển chúng thành giá trị khởi tạo của Hồ sơ phong cách (lưu DB, Vinh sửa được).

## Dự kiến: `platform/ai` theo spine

Hợp đồng chốt ở spine AD-10 (đích, chưa có):

```ts
// platform/ai (đích) — chữ ký theo AD-10; thay cho ask(schema, name, system, user) của lib/ai.ts
ask({ prompt, input, images?, videoUrl?, webSearch? })
  → { data, sources?, skipped: ("images" | "webSearch" | "video")[] }
// prompt: PromptDef { id, version, profile, output, system(style), user(input) }
//   ở modules/<miền>/prompts/<tên>.prompt.ts; quy tắc chung ở platform/ai/rules.ts
// data đã parse bằng prompt.output; sai thì thử lại đúng một lần kèm lỗi Zod;
// vẫn sai thì ném UserError tiếng Việt. Năng lực nhà cung cấp không có → ghi vào skipped, không ném lỗi.
```

- Mỗi lần gọi có hạn **90 giây**, cài trong `platform/ai` (không dựa vào `maxDuration` khi tự host); route kích hoạt `maxDuration = 120` để kịp ghi `FAILED` (AD-18).
- Nhà chính `claude -p`; thay hoặc thêm nhà dự phòng khi vướng điều khoản, hạn 90 giây hoặc hạn mức — Deferred tới story 4.1.

Các mục dưới đây ghi phương án đa nhà cung cấp tham khảo từ `~/Downloads/llm.ts` (402 dòng, không phụ thuộc thư viện). Đây **không** phải quyết định; chỉ dùng khi chọn nhà dự phòng:

- **[AI-07]** Nhà cung cấp OpenAI-compatible chat completions: Groq, Gemini, Cerebras, OpenRouter. Mỗi nhà nhiều khoá, ngăn bằng dấu phẩy trong env (`GROQ_API_KEY=k1,k2`). Model đọc từ env (`GROQ_MODEL`...), mã nguồn chỉ là giá trị dự phòng.
- **[AI-08]** `callLLM(messages, { jsonMode, maxTokens, temperature, profile, timeoutMs })` trả về chuỗi; `parseJsonFromAI<T>(text, context)` gỡ JSON bọc trong code block hoặc có newline chưa escape.
- **[AI-09]** `jsonMode` kiểm JSON ngay trong vòng thử từng nhà: nhà trả sai thì rơi sang nhà kế tiếp thay vì làm hỏng cả lời gọi. Chế độ này đòi chữ "json" có trong tin nhắn.
- **[AI-10]** Cooldown lưu trong bộ nhớ tiến trình (60s khi chạm giới hạn phút, 6h khi hết hạn mức ngày, 2 phút khi treo). Hợp với một VPS đơn; khởi động lại là xoá.
- **[AI-11]** `llm.ts` đặt timeout 55s; dự án dùng hạn **90 giây** mỗi lần gọi trong `platform/ai` (AD-18).
- **[AI-12]** Giới hạn đã biết của `llm.ts`: chỉ nhận `content: string` (chưa gửi ảnh), không tự tìm web. Theo AD-10, thiếu năng lực thì ghi vào `skipped` thay vì ném lỗi.

## Công thức: thêm một tính năng AI

Làm theo `docs/cong-thuc/them-tinh-nang-ai.md` (theo spine). Tóm tắt:

1. Prompt + schema output là `PromptDef` trong `modules/<miền>/prompts/<tên>.prompt.ts` của module chủ đích (AD-10). Không thêm vào `lib/ai.ts`.
2. Prompt có quy tắc chung từ `platform/ai/rules.ts` (`[QD-11]`); giọng văn, độ dài lấy từ Hồ sơ phong cách (FR-18), không chép cứng.
3. Tạo Gợi ý AI chỉ qua `modules/suggestions/actions.ts` (bọc `run()`): ghi `Suggestion` ở `GENERATING`, trả về ngay, gọi `ask()` trong `after()`, xong ghi `PENDING` hoặc `FAILED` (AD-9, AD-18). Ngoại lệ duy nhất: `posts.checkPostSeo`.
4. Sanitize mọi HTML từ AI (AD-22). Không gọi AI trong transaction.
5. Giao diện: một `generating-poller.client.tsx` mỗi màn; lỗi hiện bằng tiếng Việt (NFR-3).

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
