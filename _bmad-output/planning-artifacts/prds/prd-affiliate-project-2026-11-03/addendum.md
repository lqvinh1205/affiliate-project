# Addendum — PRD affiliate-project

Chi tiết kỹ thuật và bối cảnh không thuộc thân PRD; dành cho architecture/epics.

## A1. Lớp gọi AI (thay OpenAI)

- Quyết định (2026-11-03, Vinh): bỏ OpenAI SDK; dùng lớp LLM đa nhà cung cấp, tham khảo từ `~/Downloads/llm.ts` (tách từ dự án 17fishing-BE).
- Đặc điểm file tham khảo: không phụ thuộc thư viện (chỉ `fetch` + `AbortController`); giao thức OpenAI-compatible chat completions tới Groq, Gemini, Cerebras, OpenRouter; nhiều khoá mỗi nhà (ngăn bằng dấu phẩy); tự chuyển nhà khi lỗi/timeout/rate-limit; cooldown khoá trong bộ nhớ tiến trình (60s TPM, 6h hết quota, 2m treo); 2 profile `fast` / `quality`; `jsonMode` kiểm JSON ngay tại vòng gọi để rơi sang nhà kế tiếp; `parseJsonFromAI` gỡ JSON bọc code block / newline chưa escape; model đọc từ env (`GROQ_MODEL`...), timeout `LLM_TIMEOUT_MS` (mặc định 55s).
- Hệ quả với code hiện tại: `lib/ai.ts` đang dùng `openai` + `responses.parse` + `zodTextFormat` (structured output). Khi chuyển, schema zod vẫn dùng được để validate sau `parseJsonFromAI`, nhưng không còn structured output phía server → cần validate + thử lại.
- Cooldown lưu trong bộ nhớ tiến trình: hợp với 1 VPS đơn; ở Next dev/serverless, cooldown có thể bị reset thường xuyên.
- Cần kiểm khi làm architecture:
  - Khả năng **đọc ảnh** (Vinh muốn nạp ảnh sản phẩm): `gpt-oss-120b` chỉ nhận text; Gemini flash-lite nhận ảnh. Lớp LLM hiện chỉ nhận `content: string`.
  - Khả năng **AI tự search web**: các endpoint chat completions miễn phí không tự tra web. Cần một bước search riêng (API tìm kiếm) hoặc Gemini grounding (không chắc có qua endpoint OpenAI-compat).
  - Hạn mức miễn phí (Groq ~500 req/ngày, Gemini 1500 req/ngày) so với nhu cầu ~3 sản phẩm × nhiều lượt AI/ngày — nhiều khả năng đủ.

## A2. Research bối cảnh

Xem `research-landscape.md` (Shopee sub_id, Threads API, giới hạn link FB, Luật Quảng cáo 75/2025 & Luật TMĐT 122/2025).

## A3. Phương án "bộ não" AI (để architecture chọn)

Yêu cầu năng lực trong PRD: đọc ảnh, tìm thông tin web, nhà cung cấp thay được mà không sửa tính năng. Ba phương án Vinh đồng ý để architecture cân nhắc (2026-11-03):

| Phương án | Đọc ảnh | Tìm web | Chi phí | Rủi ro chính |
|---|---|---|---|---|
| Claude CLI headless (`claude -p`) — Vinh đề xuất dùng tạm | Có | Có (khi bật quyền) | Theo gói thuê bao Claude của Vinh | Chậm (vài chục giây); máy chạy CMS phải cài và đăng nhập CLI; dùng chung hạn mức với việc code; **cần kiểm điều khoản** dùng thuê bao cá nhân sau web app |
| `llm.ts` đa nhà miễn phí (A1) | Chỉ Gemini; lớp hiện chỉ nhận text | Không — cần dịch vụ search riêng | Miễn phí trong hạn mức | Model bị khai tử, hạn mức free |
| Claude API trả theo lượng dùng | Có | Có (web search tool) | Trả theo token | Chi phí hằng tháng |

Gợi ý: một lớp trừu tượng duy nhất để các tính năng không biết đang dùng nhà nào; có thể kết hợp (CLI/API cho việc cần ảnh và web, `llm.ts` cho việc nhẹ).

**Cập nhật 2026-11-03 — ngân sách 0đ/tháng (NFR-9):** loại Claude API trả theo lượng dùng. Còn lại: Claude CLI bằng gói thuê bao Vinh đang trả (chi phí biên 0đ, cần kiểm điều khoản) và `llm.ts` miễn phí. Tìm web (FR-6) cần nguồn miễn phí: công cụ tìm web của Claude CLI, hoặc một API tìm kiếm có free tier.

## A4. Ghi chú chuyển đổi từ code hiện tại (cho epics)

- `Product` đang thuộc riêng một `Post` (`onDelete: Cascade`) → chuyển sang Kho sản phẩm dùng chung (FR-4), xoá bài không xoá Sản phẩm.
- `Category` đang là enum `MEO_VAT | GOM_LINK` dùng cho route `/[category]`, badge màu, breadcrumb, bài liên quan → tách thành Loại bài (giữ enum) + Danh mục (bảng mới, FR-28). Badge màu hiện gắn Loại bài.
- `lib/images.ts` `IMAGE_HOSTS` phải thêm host lưu trữ upload được chọn (Câu hỏi mở 1).
- Tab Threads trong `components/cms/post-editor.tsx` (bài cuối chứa link website) được thay bằng FR-14/FR-16.
- Quy chuẩn bài web và giọng thương hiệu hiện nằm trong prompt `lib/ai.ts` → chuyển thành giá trị khởi tạo của Hồ sơ phong cách (FR-18).
- Seed `prisma/seed.ts` dùng link `shopee.vn/search?keyword=...` — không phải Link affiliate, sẽ bị FR-3 từ chối khi sửa.
  - **Câu hỏi mở (Story 2.3, ghi 2026-11-05):** thực tế link tìm kiếm `https://shopee.vn/search?keyword=…` **vẫn qua** kiểm tra domain của FR-3 (`shopee.vn` là domain chính chủ), nên lưu được làm Link affiliate. Code không tự thêm quy tắc đường dẫn (epics: "Không tự thêm quy tắc đường dẫn"). Cần PRD chốt: FR-3 chỉ kiểm domain, hay phải chặn thêm đường dẫn không phải link sản phẩm/affiliate (vd `/search`)?
