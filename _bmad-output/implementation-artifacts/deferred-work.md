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
  evidence: Giới hạn một lần gọi thật mỗi epic; adapter đã kiểm tới API bằng model không tồn tại (lỗi `unrecognized_model` được đọc đúng). Sau review gộp: CLI nhận JSON Schema nghiên cứu thật (`{data, sources}`) và luật `Read(//<thư mục tạm>/**)` (chạy tới API với model không tồn tại, 0 token). Chưa đo: sonnet + tìm web + đọc tối đa 4 ảnh có xong trong hạn 90 giây của `ask` không. Kiểm tay: bấm "Nghiên cứu" trên `/cms/san-pham/[id]` với `AI_PROVIDERS=claude-cli`, ghi thời gian; quá hạn thì tăng `AI_TIMEOUT_MS` (≤ 110 000 vì `maxDuration` 120) hoặc bớt ảnh.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md`
  summary: AC Story 4.1 lệch: chưa có nhà AI dự phòng thật (xem mục trên), và `createPost`/`runThreads` đã chuyển sang `claude -p` + gỡ gói `openai` ngay ở Epic 4 thay vì giữ OpenAI tới Epic 5.
  evidence: Quyết định tự chọn 1 và 3 trong spec Epic 4 (cần Vinh xem lại); nếu Vinh chấp nhận thì sửa AC 4.1 trong `epics.md` cho khớp.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md`
  summary: `WebFetch` bật cùng lần gọi có dữ liệu ngoài (đánh giá Shopee, trang web) chưa giới hạn tên miền.
  evidence: Review gộp Epic 4. `Read` đã giới hạn đúng thư mục tạm (chỉ chứa ảnh Sản phẩm), tiến trình con không có biến bí mật — không còn gì nhạy cảm để lộ qua `WebFetch`. Giới hạn tên miền sẽ làm nghiên cứu mất nguồn; xem lại nếu sau này thư mục tạm chứa dữ liệu riêng.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md`
  summary: Docs còn nhắc `lib/ai.ts`, `app/cms/actions.ts`, OpenAI: `docs/quy-uoc-code.md`, `docs/nen-tang-ky-thuat/{kiem-tra-va-bao-mat,nextjs-16,prisma-7,giao-dien}.md`, `docs/cong-thuc/{them-server-action,bo-chuc-nang,doi-schema,them-man-hinh,sua-loi}.md`, `docs/{kiem-chung,quy-dinh,README,viet-workflow}.md`; khối `bmad:context` của `AGENTS.md` (dòng mô tả dự án, Policy, Where things are).
  evidence: Epic 4 đã sửa `lop-ai.md`, `kien-truc-codebase.md`, `chuyen-code-cu.md`, `them-tinh-nang-ai.md`, `no-ky-thuat.md`; `AGENTS.md` làm mới qua `bmad-project-context` (QD-03 cấm sửa tay khối này).
- source_spec: `_bmad-output/implementation-artifacts/spec-4-luot-gop-epic-4.md`
  summary: (có từ trước) `next start` log lỗi "unstable value `crypto.randomUUID()` while prerendering" ở `/cms/san-pham`.
  evidence: Thấy khi kiểm Epic 4 trên cổng 3300; trang vẫn trả 200; màn danh sách không đổi ở Epic 4.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-luot-gop-epic-5.md`
  summary: RiskWarning chỉ bôi chọn và cuộn tới câu khi chạm; chưa vẽ gạch chân lượn `tertiary` cho mọi câu bị cảnh báo trong ô chữ / PostEditor (UX-DR43).
  evidence: Quyết định tự chọn 19. `<textarea>` không tô được một đoạn chữ; cần lớp phủ (textarea) hoặc decoration Tiptap (PostEditor) — làm khi Vinh muốn đủ UX-DR43.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-luot-gop-epic-5.md`
  summary: Chưa tạo Bộ nội dung thật với `claude -p`: chưa đo Bài web (`sonnet`, 600–900 từ + Cảnh báo rủi ro) có xong trong hạn 90 giây của `ask` không.
  evidence: Lần gọi thật duy nhất của epic dùng cho bộ câu mẫu Cảnh báo rủi ro (9,3 giây, `haiku`). Kiểm tay: Chi tiết Sản phẩm có hồ sơ đã Duyệt → "Tạo bộ nội dung" 3 nền tảng với `AI_PROVIDERS=claude-cli`, ghi thời gian từng thẻ; quá hạn thì tăng `AI_TIMEOUT_MS` (≤ 110 000) hoặc đổi `CLAUDE_CLI_MODEL_QUALITY`.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-luot-gop-epic-5.md`
  summary: Khối `bmad:context` của `AGENTS.md` chưa nhắc `modules/style-profiles`, `modules/content-sets`, màn `/cms/bo-noi-dung/[id]`, `/cms/phong-cach`; docs `nen-tang-ky-thuat/{kiem-tra-va-bao-mat,nextjs-16,prisma-7,giao-dien}.md` còn nhắc `createPost` nhánh AI và `runThreads` đã gỡ.
  evidence: QD-03 cấm sửa tay khối `bmad:context` — làm mới qua `bmad-project-context`. Epic 5 đã sửa `kien-truc-codebase.md`, `lop-ai.md`, `no-ky-thuat.md`, `chuyen-code-cu.md`, `kiem-chung.md`.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-luot-gop-epic-5.md`
  summary: Giới hạn cứng tự đặt cho nội dung mạng xã hội và Bài web do AI viết (`WEB_POST_WORDS_MAX` 3000, `THREADS_PARTS_MAX` 10, `FACEBOOK_WORDS_MAX` 1000, `FACEBOOK_POST_MAX` 8000, `LINK_COMMENT_MAX` 2000) cần Vinh xác nhận.
  evidence: Quyết định tự chọn 5; chỉ `THREADS_POST_MAX` = 500 có trong PRD (FR-14).
- source_spec: `_bmad-output/implementation-artifacts/spec-5-luot-gop-epic-5.md`
  summary: Số đo Cảnh báo rủi ro (FR-23) chưa đo qua prompt nội dung thật: `scripts/risk-eval/run.ts` vẫn dùng prompt kiểm riêng trên danh sách câu, còn sản phẩm để AI tự đánh dấu trong nội dung nó vừa viết (Bài web / Threads / Facebook / Bình luận). Kết quả 12/12, 0/12 ngày 2026-11-06 còn chấm bằng cách so khớp chuỗi con cũ.
  evidence: Review gộp Epic 5 (#6, #11). Đã sửa cách chấm (`scripts/risk-eval/score.ts`: qua `cleanRiskWarnings`, khớp nguyên câu sau chuẩn hoá; có test). Cần gọi AI thật (hết lượt của Epic 5): chạy lại script để có số theo cách chấm mới, và dựng bộ đo chèn câu mẫu vào nguồn rồi gọi `threadsPostPrompt`/`facebookPostPrompt` để đo trên đường chạy thật.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-luot-gop-epic-5.md`
  summary: `Product.affiliateUrl` không giới hạn độ dài khi lưu; Link affiliate quá dài làm Bình luận kèm link Threads (≤ 500 ký tự) không tạo được.
  evidence: Review gộp Epic 5 (#2). Đã xử lý ở Bình luận: rút tên Sản phẩm ở dòng link, còn quá thì thẻ Lỗi nói "Rút gọn Link affiliate ở Sản phẩm rồi Tạo lại." Chặn từ lúc lưu Sản phẩm (vd. tối đa 300 ký tự, gợi ý dùng `s.shopee.vn`) cần Vinh chọn con số — Story Epic 2 không nêu.
- source_spec: `_bmad-output/implementation-artifacts/spec-7-luot-gop-epic-7.md`
  summary: `clientKey` (`platform/rate-limit.ts`) giả định đúng một tầng reverse proxy nối IP vào cuối `x-forwarded-for`. Đặt sau CDN (Cloudflare) + nginx thì mục cuối là IP của CDN → mọi người đọc chung một khoá, giới hạn 60/phút chặn nhầm; chạy `next start` lộ thẳng ra mạng (không proxy) thì client tự đặt cả header nên vẫn giả được.
  evidence: Review gộp Epic 7 (#1, #4). Chốt khi làm hạ tầng production (Deferred "Hạ tầng production" của spine): cấu hình proxy ghi đè `X-Forwarded-For` bằng `$remote_addr` hoặc thêm cấu hình số tầng proxy tin cậy (chỉ khi có CDN).
- source_spec: `_bmad-output/implementation-artifacts/spec-8-luot-gop-epic-8.md`
  summary: Trang 404 trong `(site)` (`/bai-viet/khong-co`, `/khong-co-trang-nay`) trả HTML vỏ lỗi `<html id="__next_error__">` — nội dung 404 (EmptyState, SearchBox, Xem nhiều) chỉ hiện sau khi JS dựng từ dữ liệu RSC; 404 gốc (`/a/b/c/d`) có HTML đủ.
  evidence: Có từ trước Epic 8: dựng lại với `not-found-screen.tsx` của HEAD (dd3109f) vẫn ra vỏ lỗi; mã HTTP vẫn 404. Cần tìm nguyên nhân (có thể do `notFound()` trong route `ensureStatic = "navigation"` chưa prerender) — đọc `node_modules/next/dist/docs/` về `not-found` + `ensureStatic` rồi thử `instant`/vị trí `notFound()`.
- source_spec: `_bmad-output/implementation-artifacts/spec-8-luot-gop-epic-8.md`
  summary: Tìm kiếm xếp bài khớp theo mới xuất bản trước, không theo mức liên quan (tiêu đề khớp không được ưu tiên hơn thân bài); không có tìm theo cụm từ.
  evidence: Quyết định tự chọn 8 của Epic 8. Khi số bài lớn (vài trăm bài trở lên) cân nhắc `pg_trgm`/full-text Postgres (thay đổi kiến trúc — sửa spine trước).
- source_spec: `_bmad-output/implementation-artifacts/spec-8-luot-gop-epic-8.md`
  summary: Tìm kiếm công khai (`searchPostsRecord`, không cache) đọc cả `content` và chạy `sanitizePostHtml` để tính phút đọc cho tối đa 20 kết quả mỗi lần gõ; bài dài (tới 200 000 ký tự) làm mỗi lần tìm nặng.
  evidence: Review gộp Epic 8 #3. Đang chặn bởi trần 20 kết quả + 60 lần/phút/nguồn. Sửa gốc: lưu phút đọc thành cột `Post.readingMinutes` khi ghi bài (service + seed + backfill), `postCardSelect` bỏ `content` — mọi PostCard (Trang chủ, Danh mục, Xem nhiều) cùng nhẹ đi.
- source_spec: `_bmad-output/implementation-artifacts/spec-10-luot-gop-epic-10.md`
  summary: Cảm hứng có file video: AI chưa nhận "khung hình" của video (Story 10.2 AC) — `claude -p` không đọc video nên `ask({ videoUrl })` trả `skipped` có `video`; hồ sơ chỉ dựa trên link, ghi chú (và ảnh nếu file là ảnh). Link TikTok/Pinterest cũng chỉ đọc được tiêu đề/chú thích trang qua tìm web.
  evidence: Spine Deferred "cách đọc video từ link"; tách khung hình cần `ffmpeg` hoặc thư viện chưa có trong spine/UX/PRD (không cài theo luật lượt chạy). Màn Cảm hứng báo rõ và gợi ý tải ảnh chụp màn hình (`INSPIRATION_VIDEO_SKIPPED`). Chốt cùng nhà AI đọc được video.
- source_spec: `_bmad-output/implementation-artifacts/spec-10-luot-gop-epic-10.md`
  summary: Dải "AI chưa đọc được video" của gợi ý nghiên cứu Cảm hứng chọn câu theo file **hiện tại** của Cảm hứng, không theo file đã gửi cho AI lúc tạo gợi ý — sửa file (thêm/đổi ảnh) sau khi Nghiên cứu mà chưa Tạo lại thì câu có thể lệch (vd. nói "dựa trên ảnh chụp màn hình" dù lần đó chưa có ảnh).
  evidence: Review gộp Epic 10 #4 (quyết định 16). Sửa gốc: lưu đầu vào đã gửi/đã đọc của gợi ý (vd. cột Json `Suggestion.input` hoặc thêm vào `skipped`) — đổi schema, làm cùng việc đọc khung hình video.
