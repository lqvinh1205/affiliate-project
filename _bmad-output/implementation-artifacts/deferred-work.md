- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: Nhánh AI của createPost (NO-06) chưa có test; viết khi chuyển action sang modules/suggestions.
  evidence: Xoá khối postInputSchema.safeParse trong app/cms/actions.ts thì 46 test vẫn xanh.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: Chưa có test cho productInputSchema/postInputSchema ghép (affiliateUrl Shopee, ảnh //host).
  evidence: Không test nào import lib/post-input; viết khi chuyển schema sang modules/posts, modules/products.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: setPostStatus chưa có test tích hợp cho "Không tìm thấy bài viết" và "chưa có nội dung".
  evidence: Cần DB test (AD-16); hiện chưa có khung test tích hợp.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: withHeadingIds sinh id trùng với dãy heading "X", "X 3", "X".
  evidence: Hậu tố dùng headings.length + 1, có thể trùng slug của heading khác; code có từ trước.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: AGENTS.md và docs (quy-uoc-code, kien-truc-codebase, nen-tang-ky-thuat/*) còn trỏ lib/* đã xoá.
  evidence: AGENTS.md dòng nói lib/auth.ts, lib/sanitize.ts, lib/images.ts; làm ở Story 1.5 qua bmad-project-context.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: app/cms/page.tsx, app/cms/posts/[id]/page.tsx, app/cms/actions.ts import thẳng platform/db, trái AD-2.
  evidence: Có từ trước (lib/db); sửa khi tách sang modules/posts/cms-queries.ts, đưa vào ignores ở Story 1.3.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: platform/ còn thiếu RESERVED_ROOT_SLUGS (AD-20), requiredText và slugField (AD-14).
  evidence: Spec 1.2 cấm thêm hàm chưa ai dùng; thêm ở story Danh mục và story tách schema.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md`
  summary: Chưa bật nhà AI dự phòng (NFR-2); `AI_PROVIDERS` chỉ có `claude-cli`. Đề xuất Gemini 2.5 Flash-Lite qua `fetch` API gốc (ảnh + grounding 500 lượt/ngày, không thêm thư viện), Tavily cho tìm web.
  evidence: Cần Vinh trả lời Q3 của `research/recon-ai-storage-2026-11-05.md` (Google dùng dữ liệu free tier) và tạo API key; khung chuyển nhà + cooldown đã có và có test (`platform/ai/ask.test.ts`).
- source_spec: `_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md`
  summary: Chưa có lần gọi `claude -p` thật đi trọn qua adapter (`ask` → `structured_output`); lần gọi thật duy nhất của epic chạy thẳng CLI với cùng bộ cờ (exit 0, trả JSON).
  evidence: Giới hạn một lần gọi thật mỗi epic; adapter đã kiểm tới API bằng model không tồn tại (lỗi `unrecognized_model` được đọc đúng). Kiểm tay: bấm "Nghiên cứu" trên `/cms/san-pham/[id]` với `AI_PROVIDERS=claude-cli`.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md`
  summary: Docs còn nhắc `lib/ai.ts`, `app/cms/actions.ts`, OpenAI: `docs/quy-uoc-code.md`, `docs/nen-tang-ky-thuat/{kiem-tra-va-bao-mat,nextjs-16,prisma-7,giao-dien}.md`, `docs/cong-thuc/{them-server-action,bo-chuc-nang,doi-schema,them-man-hinh,sua-loi}.md`, `docs/{kiem-chung,quy-dinh,README,viet-workflow}.md`; khối `bmad:context` của `AGENTS.md` (dòng mô tả dự án, Policy, Where things are).
  evidence: Epic 4 đã sửa `lop-ai.md`, `kien-truc-codebase.md`, `chuyen-code-cu.md`, `them-tinh-nang-ai.md`, `no-ky-thuat.md`; `AGENTS.md` làm mới qua `bmad-project-context` (QD-03 cấm sửa tay khối này).
- source_spec: `_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md`
  summary: Duyệt Danh mục gợi ý làm form Sản phẩm mount lại (khoá theo `categoryId`): thay đổi chưa lưu trên form Sản phẩm bị mất.
  evidence: AD-12 (form chỉ đọc `defaultValues` lúc mount); một người vận hành, thao tác hiếm; cách sửa gọn hơn là cập nhật trường Danh mục qua `setValue` khi Duyệt.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md`
  summary: (có từ trước) `next start` log lỗi "unstable value `crypto.randomUUID()` while prerendering" ở `/cms/san-pham`.
  evidence: Thấy khi kiểm Epic 4 trên cổng 3300; trang vẫn trả 200; màn danh sách không đổi ở Epic 4.
