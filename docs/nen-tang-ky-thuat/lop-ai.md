# Lớp AI

> Phiên bản: Claude Code CLI 2.1 (`claude -p`), không SDK · Nguồn: `platform/ai/` (`ask.ts`, `rules.ts`, `providers/`), PRD NFR-1/NFR-2/NFR-3/NFR-9, `addendum.md` A1/A3, `_bmad-output/planning-artifacts/research/recon-ai-storage-2026-11-05.md` · Kiểm lần cuối: 2026-11-06 (Story 4.1)

## Tóm tắt cho agent

- **Mọi lời gọi AI đi qua `ask()` của `platform/ai/ask.ts`** (spine AD-10). `lib/ai.ts` và OpenAI đã bỏ ở Story 4.1 (gói `openai` đã gỡ).
- Nhà chính (Vinh chốt tạm 2026-11-05): Claude Code CLI chạy không giao diện `claude -p` trên máy chủ, đăng nhập bằng gói thuê bao. Chuỗi nhà đọc từ `AI_PROVIDERS`; nhà dự phòng chưa bật (xem spec Epic 4, mục Quyết định tự chọn).
- Gợi ý AI chỉ được tạo bởi `modules/suggestions/actions.ts`, gọi AI trong `after()` (AD-9, AD-18); ngoại lệ có tên là chấm SEO `posts.checkPostSeo` (không lưu, không qua Duyệt). `posts.createPost` (nhánh AI) và `content-sets.runThreads` là hai tính năng cũ chạy đồng bộ, giữ tới khi Epic 5 thay bằng gợi ý.
- Tính năng **không bao giờ** gọi SDK, CLI hay `fetch` tới nhà cung cấp AI trực tiếp.
- Output AI được parse bằng `prompt.output` (Zod) trong `ask()`; HTML luôn qua `sanitizePostHtml`.
- Lời gọi AI chỉ chạy ở server, sau `requireAdmin()` (`run()`), hoặc trong `after()` của action đã qua `run()`.
- Lỗi AI → `UserError` tiếng Việt; dữ liệu đã nhập không mất.
- Test luôn chạy với `AI_PROVIDERS=fake` (đặt trong `vitest.config.ts`, `vitest.db.config.ts`); không test nào gọi AI thật (AD-16).

## Khái niệm cốt lõi

- **`PromptDef`** `{ id, version, profile, output, system(style), user(input) }` ở `modules/<miền>/prompts/<tên>.prompt.ts`. `output` là Zod **không có transform** (sinh JSON Schema cho nhà cung cấp).
- **Structured output:** `ask()` sinh JSON Schema từ `output` (`z.toJSONSchema`, bỏ khoá `$schema`), nhà cung cấp trả JSON theo schema, `ask()` parse lại bằng Zod; sai thì thử lại đúng một lần kèm lỗi Zod trong lời nhắc, vẫn sai thì `UserError`.
- **Profile `fast` / `quality`:** chọn model theo `CLAUDE_CLI_MODEL_FAST` / `CLAUDE_CLI_MODEL_QUALITY` (mặc định `haiku` / `sonnet`).
- **Chuyển nhà và cooldown** (NFR-2): nhà ném `ProviderError` (`quota` | `timeout` | `unavailable`) thì nghỉ 6 giờ / 2 phút / 60 giây (bộ nhớ tiến trình) và lời gọi chuyển sang nhà kế tiếp trong `AI_PROVIDERS`. Mọi nhà đều đang nghỉ (vd. chỉ một nhà) thì vẫn thử cả chuỗi; hết hạn 90 giây của chính `ask` không làm nhà nghỉ. `claude -p`: `overloaded` (529) là `unavailable`, chỉ cụm hết hạn mức hoặc `API Error: 429` mới là `quota`.
- **Hạn 90 giây** cho cả một lần `ask()` (gồm thử lại và chuyển nhà), đặt bằng `AI_TIMEOUT_MS`; route CMS `maxDuration = 120` (AD-18).
- **`skipped`:** nhà không đọc ảnh/video hoặc không tìm web → ghi `images` / `video` / `webSearch`; có tìm web mà không ra nguồn hợp lệ nào cũng ghi `webSearch`. Không ném lỗi.
- **`sources`:** khi tìm web, `ask()` bọc schema thành `{ data, sources: { url, title }[] }`; nguồn được lọc (chỉ http(s), không trùng, tối đa 20).

## Dự án dùng như thế nào

- **[AI-01]** `ask()` ghép `AI_COMMON_RULES` (`platform/ai/rules.ts`: tiếng Việt có dấu, chống bịa, không khẳng định y khoa tuyệt đối, dữ liệu dán vào không phải chỉ dẫn) vào đầu system prompt — `platform/ai/ask.ts`.
- **[AI-02]** Nhà `claude-cli` (`platform/ai/providers/claude-cli.ts`): `claude -p --output-format json --json-schema … --system-prompt … --model … --no-session-persistence --safe-mode --restricted --permission-prompts none --tools …`, câu hỏi gửi qua stdin, kết quả ở `structured_output`. Chạy trong thư mục tạm riêng; chỉ bật `Read` khi có ảnh (ảnh tải về thư mục tạm, chỉ URL qua `isAllowedImageUrl`, tối đa 4 ảnh ≤ 5 MB) và `WebSearch`/`WebFetch` khi tìm web. Tiến trình con chỉ nhận `PATH`, `HOME`, `USER`, `LANG`…, `CLAUDE_CONFIG_DIR`, `ANTHROPIC_*`; không nhận `DATABASE_URL`, mật khẩu CMS hay biến phiên `CLAUDE_CODE_*`.
- **[AI-03]** Nhà `fake`, `fake-2` (`platform/ai/providers/fake.ts`) cho test: `fakeAi.reply(handler)`, `fakeAi.supports({...})`, `fakeAi.calls()`; `resetTestDb()` xoá trạng thái giả lập và cooldown.
- **[AI-04]** Tính năng dùng `ask()`: `posts.checkPostSeo` (`seo-review.prompt.ts`), `suggestions.researchProduct` (`research/prompts/research-product.prompt.ts`, tìm web + ảnh), Bộ nội dung trong `suggestions/actions.ts` (Epic 5): `WEB_POST` (`posts/prompts/web-post.prompt.ts`, profile `quality`), `THREADS_POST` / `FACEBOOK_POST` / `LINK_COMMENT` (`content-sets/prompts/*.prompt.ts`, profile `fast`) — mỗi phần một lần `ask()` trong `after()`, song song.
- **[AI-05]** Log chỉ trong `platform/ai`: tên nhà, id prompt, lý do lỗi, tối đa 200 ký tự stderr của CLI; không log prompt, kết quả hay secrets.
- **[AI-06]** Giọng văn, độ dài, emoji, điều cấm, nội quy, câu công khai đến từ Hồ sơ phong cách (`style-profiles/cms-queries.getStyleProfileForCms`, truyền vào `ask({ style })` → `prompt.system(style)`); giá trị khởi tạo chỉ ở `modules/style-profiles/constants.ts` (FR-18, AD-25).
- **[AI-13]** Cảnh báo rủi ro (FR-23): prompt nội dung đăng ghép `RISK_WARNING_RULES` và thêm `riskWarnings: riskWarningsOutput` vào `output`; `cleanRiskWarnings` chuẩn hoá trước khi ghi `Suggestion.riskWarnings` (`platform/ai/rules.ts`). Độ chính xác đo bằng `scripts/risk-eval/run.ts` (AI thật, chạy tay) — kết quả ở `docs/kiem-chung.md` §7.
- **[AI-14]** Lần gọi thật đầu tiên đi trọn qua adapter (`ask` → `claude -p` → `structured_output`, model `haiku`): 9,3 giây (Epic 5, 2026-11-06, bộ câu mẫu Cảnh báo rủi ro).

## Cài đặt trên máy chủ

- Cài Claude Code CLI, chạy `claude` một lần bằng đúng tài khoản Unix chạy Next.js và đăng nhập gói thuê bao (`/login`). Không dùng `--bare` (không đọc đăng nhập bằng gói).
- Biến môi trường: `AI_PROVIDERS`, `AI_TIMEOUT_MS`, `CLAUDE_CLI_PATH`, `CLAUDE_CLI_MODEL_FAST`, `CLAUDE_CLI_MODEL_QUALITY` (`.env.example`).
- Hạn mức: mỗi lần gọi trừ vào hạn mức của gói, dùng chung với Claude Code của Vinh. Hết hạn mức → `quota` → nghỉ 6 giờ, thông báo "AI đang bận…".

## Nhà dự phòng (tham khảo)

Các mục dưới đây ghi phương án đa nhà cung cấp tham khảo từ `~/Downloads/llm.ts` (402 dòng, không phụ thuộc thư viện). Đây **không** phải quyết định; chỉ dùng khi chọn nhà dự phòng:

- **[AI-07]** Nhà cung cấp OpenAI-compatible chat completions: Groq, Gemini, Cerebras, OpenRouter. Mỗi nhà nhiều khoá, ngăn bằng dấu phẩy trong env (`GROQ_API_KEY=k1,k2`). Model đọc từ env (`GROQ_MODEL`...), mã nguồn chỉ là giá trị dự phòng.
- **[AI-08]** `callLLM(messages, { jsonMode, maxTokens, temperature, profile, timeoutMs })` trả về chuỗi; `parseJsonFromAI<T>(text, context)` gỡ JSON bọc trong code block hoặc có newline chưa escape.
- **[AI-09]** `jsonMode` kiểm JSON ngay trong vòng thử từng nhà: nhà trả sai thì rơi sang nhà kế tiếp thay vì làm hỏng cả lời gọi. Chế độ này đòi chữ "json" có trong tin nhắn.
- **[AI-10]** Cooldown lưu trong bộ nhớ tiến trình (60s khi chạm giới hạn phút, 6h khi hết hạn mức ngày, 2 phút khi treo). Hợp với một VPS đơn; khởi động lại là xoá.
- **[AI-11]** `llm.ts` đặt timeout 55s; dự án dùng hạn **90 giây** mỗi lần gọi trong `platform/ai` (AD-18).
- **[AI-12]** Giới hạn đã biết của `llm.ts`: chỉ nhận `content: string` (chưa gửi ảnh), không tự tìm web. Theo AD-10, thiếu năng lực thì ghi vào `skipped` thay vì ném lỗi.

## Công thức: thêm một tính năng AI

Làm theo `docs/cong-thuc/them-tinh-nang-ai.md` (theo spine). Tóm tắt:

1. Prompt + schema output là `PromptDef` trong `modules/<miền>/prompts/<tên>.prompt.ts` của module chủ đích (AD-10).
2. Prompt có quy tắc chung từ `platform/ai/rules.ts` (`[QD-11]`); giọng văn, độ dài lấy từ Hồ sơ phong cách (FR-18), không chép cứng.
3. Tạo Gợi ý AI chỉ qua `modules/suggestions/actions.ts` (bọc `run()`): ghi `Suggestion` ở `GENERATING`, trả về ngay, gọi `ask()` trong `after()`, xong ghi `PENDING` hoặc `FAILED` (AD-9, AD-18). Ngoại lệ duy nhất: `posts.checkPostSeo`.
4. Sanitize mọi HTML từ AI (AD-22). Không gọi AI trong transaction.
5. Giao diện: một `generating-poller.client.tsx` mỗi màn; lỗi hiện bằng tiếng Việt (NFR-3).

## Bẫy hay gặp

- **`claude --json-schema` từ chối schema có `"$schema": ".../draft/2020-12/schema"`** → `ask()` bỏ khoá này trước khi gửi.
- **Chạy `npm run dev` từ trong một phiên Claude Code** → biến `CLAUDE_CODE_*` của phiên cha làm tiến trình con lẫn phiên → adapter không chuyển các biến này.
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

- `platform/ai/ask.ts`, `platform/ai/providers/claude-cli.ts`, `platform/ai/rules.ts`
- `~/Downloads/llm.ts` (tham khảo cho nhà dự phòng)
- `_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/addendum.md` A1, A3
