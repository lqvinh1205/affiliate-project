---
title: 'Lượt gộp Epic 4: Nghiên cứu Sản phẩm bằng AI — Story 4.1–4.5'
type: 'feature'
created: '2026-11-06'
status: 'review'
review_loop_iteration: 0
baseline_revision: '6b14178375505c347137cebfad6b393fc122f602'
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-3-luot-gop-epic-3.md'
  - '{project-root}/_bmad-output/planning-artifacts/research/recon-ai-storage-2026-11-05.md'
  - '{project-root}/docs/cong-thuc/them-tinh-nang-ai.md'
  - '{project-root}/docs/cong-thuc/chuyen-code-cu.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
  - '{project-root}/docs/cong-thuc/them-server-action.md'
warnings: ['oversized', 'multiple-goals']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Chưa có lớp AI chung: code AI cũ gọi OpenAI thẳng ở `lib/ai.ts` + `app/cms/actions.ts` (trái AD-10, NFR-1, ngoại lệ AD-17 còn mở). Chi tiết Sản phẩm chưa có nghiên cứu bằng AI; chưa có bảng `Suggestion`, luồng Duyệt/Tạo lại, poller mà Epic 5 cần. Epic 4 gồm Story 4.1–4.5 trong `_bmad-output/planning-artifacts/epics.md` (đọc nguyên văn từng story).

**Approach:** Một lượt triển khai theo thứ tự 4.1 → 4.2 → 4.3 → 4.4 → 4.5, rồi một lượt kiểm chứng gộp (cách làm theo lượt, Vinh 2026-11-05). 4.1 dựng `platform/ai` với nhà chính `claude -p` (chốt tạm 2026-11-05) và chuyển hết code AI cũ; 4.2–4.5 dựng một lần gọi AI nghiên cứu trả hồ sơ + Danh mục gợi ý, ghi hai `Suggestion`, Duyệt vào `ResearchProfile` và `Product.categoryId`.

## Boundaries & Constraints

**Always:** Mọi quy tắc spine và mẫu đã có (module AD-5, đường ghi AD-6 qua `run()`, route mỏng AD-12, form AD-14 RHF + `zodResolver` + cùng `schema.ts`, Prisma AD-15, test AD-16); AD-9/AD-10/AD-18/AD-19 cho phần AI theo `docs/cong-thuc/them-tinh-nang-ai.md`; test chỉ dùng nhà cung cấp giả lập (`AI_PROVIDERS=fake`), tối đa một lần gọi `claude -p` thật trong epic để kiểm adapter; mỗi story tối đa một migration (4.2 `add_suggestion`, 4.3 `add_research_profile`); chuyển file cũ theo `chuyen-code-cu.md`, sửa mọi import, cập nhật `LEGACY_APP_FILES`.

**Never:** Không dùng OpenAI hay SDK nhà cung cấp nào; không thêm thư viện npm (spine/UX/PRD không nêu thư viện mới cho epic này); không dịch vụ trả phí; không Bộ nội dung, AudiencePicker/AnglePicker để chọn, CreateContentSetPanel, Cảnh báo rủi ro, CopyButton (Epic 5); không cào dữ liệu Shopee; không gọi AI trong transaction; không `updateTag` trong `after()`; không sửa khối `bmad:context`/nextjs của `AGENTS.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| `ask` parse lỗi một lần | nhà trả JSON sai schema rồi đúng | thử lại đúng một lần kèm lỗi Zod, trả `data` | sai cả hai → `UserError` tiếng Việt |
| Nhà lỗi / hết hạn mức / quá hạn | nhà 1 ném lỗi, nhà 2 trả đúng | dùng nhà 2; nhà 1 vào cooldown | mọi nhà lỗi → `UserError` "AI đang bận…", dữ liệu không mất |
| Năng lực thiếu | nhà không đọc ảnh / không tìm web | `skipped` có `images` / `webSearch`, không ném lỗi | — |
| Chấm SEO | chạm "Chấm điểm SEO" | `posts.checkPostSeo` → điểm + gợi ý, không lưu | lỗi → Toast tiếng Việt |
| Nghiên cứu lần đầu | Sản phẩm chưa có gợi ý | ghi `RESEARCH` + `PRODUCT_CATEGORY` ở `GENERATING`, trả ngay; `after()` gọi AI | — |
| AI xong | `after()` thành công | hai gợi ý `PENDING`, payload đủ khu; Người đọc/Góc viết có `id` | không có đánh giá → không có Khen/Chê/Phù hợp |
| AI lỗi | `after()` ném lỗi | hai gợi ý `FAILED` kèm thông báo tiếng Việt | thẻ hiện Alert + "Tạo lại" |
| Rời màn, quay lại | `GENERATING` | GeneratingIndicator + poller 3 giây | quá 120 giây → hiện Lỗi |
| Duyệt hồ sơ (có sửa) | `PENDING` + payload đã sửa | upsert `ResearchProfile`, `APPROVED`, `editedBeforeApproval = true`, `updateTag` | Duyệt hai lần → một `ResearchProfile`, lần hai `UserError` |
| Tạo lại | `PENDING`/`FAILED`/`REJECTED` + chỉ dẫn | bản `PENDING` cũ → `SUPERSEDED`; bản mới mang `parentSuggestionId`, `GENERATING` | đang `GENERATING` (< 120 giây) → `UserError`; quá 120 giây → bản cũ `FAILED` trong cùng transaction |
| Từ chối | `PENDING` | `REJECTED`, thẻ thu còn đầu thẻ + "Tạo lại" | — |
| Danh mục gợi ý | AI chọn Danh mục có sẵn | thẻ dưới hồ sơ, Duyệt → `Product.categoryId`, `updateTag(products)` | AI chọn id không có → `FAILED` "AI không chọn được Danh mục có sẵn phù hợp" |
| Hai gợi ý đang chờ | gọi nghiên cứu hai lần song song | partial unique index chặn bản thứ hai | `UserError` "Đang nghiên cứu…" |

</intent-contract>

## Code Map

**4.1 — Lớp AI chung, chấm SEO, chuyển code cũ**

- `platform/ai/ask.ts` (`ask`, `PromptDef`, chuỗi nhà, cooldown, hạn 90 giây, thử lại parse một lần, `skipped`, `sources`), `platform/ai/rules.ts` (`AI_COMMON_RULES`), `platform/ai/providers/types.ts`, `platform/ai/providers/claude-cli.ts` (`claude -p --output-format json --json-schema`, chạy trong thư mục tạm, `--restricted`/`--safe-mode`, công cụ chỉ `Read` khi có ảnh và `WebSearch`/`WebFetch` khi tìm web), `platform/ai/providers/fake.ts` (giả lập cho test); unit test `platform/ai/ask.test.ts`, `platform/ai/providers/claude-cli.test.ts`.
- `modules/posts/prompts/seo-review.prompt.ts`, `modules/posts/prompts/web-post.prompt.ts`; `modules/posts/actions.ts` thêm `checkPostSeo`, `createPost` (bản trống hoặc AI viết — chuyển từ `app/cms/actions.ts`, hành vi giữ nguyên tới Epic 5).
- `modules/content-sets/prompts/threads-post.prompt.ts`, `modules/content-sets/actions.ts` (`runThreads`, giữ nguyên hành vi tới Epic 5 — [NO-10]).
- Xoá `lib/ai.ts`, `app/cms/actions.ts`, `app/cms/actions.db.test.ts` (test chuyển sang `modules/posts/actions.db.test.ts`); `eslint.config.mjs` `LEGACY_APP_FILES` rỗng; gỡ gói `openai`, `.env.example` thay biến OpenAI bằng biến `AI_*`/`CLAUDE_CLI_*`.
- SeoCheckPanel: `modules/posts/components/post-seo-check.client.tsx` + `seo-score.tsx` theo UX-DR52 (Card, điểm `headline-lg`, không đỏ/xanh).

Tính năng AI: Chấm SEO (FR-13) — ngoại lệ AD-9: không `Suggestion`, không lưu
- Prompt: `modules/posts/prompts/seo-review.prompt.ts` — id `posts.seo-review`, version 1, profile `fast`
- images: không · webSearch: không · HTML trong output: không
- Action: `modules/posts/actions.ts` → `checkPostSeo`; route `/cms/bai-viet/[id]` (`maxDuration` 120 từ `app/cms/layout.tsx`)

**4.2 — Nghiên cứu và theo dõi tiến trình**

- `prisma/schema/suggestions.prisma` (`Suggestion`, enum `SuggestionKind` = `RESEARCH`, `PRODUCT_CATEGORY`; `SuggestionStatus`), migration `add_suggestion` (CHECK đích, partial unique index `(kind, productId)` khi `GENERATING`/`PENDING`); quan hệ ngược `Product.suggestions`.
- `modules/suggestions/{constants,schema,types,service,cms-queries,actions}.ts`: `researchProduct` (tạo lần đầu và Tạo lại), `startResearchRecords`, `after()` gọi `ask` rồi `completeResearchRecords` / `failSuggestionsRecord`; `getProductSuggestionsForCms` (`GENERATING` quá 120 giây trả là `FAILED`; payload parse qua `research/cms-queries.ts`). Không có `tags.ts` (bảng `Suggestion` chỉ đọc ở CMS, không cache).
- `modules/research/prompts/research-product.prompt.ts` (`researchProductPrompt`, `researchProfileSchema` payload `RESEARCH`, `productCategoryPayloadSchema` payload `PRODUCT_CATEGORY`).
- `modules/suggestions/components/`: `suggestion-status-badge.tsx`, `suggestion-card.tsx`, `generating-poller.client.tsx`, `generating-indicator.client.tsx`, `research-profile-card.tsx`, `research-button.client.tsx`, `research-approval-form.client.tsx`, `reject-suggestion-button.client.tsx`, `skipped-notice.tsx`, `suggestion-error.tsx`; `components/ui/alert.tsx` thêm bằng shadcn CLI (không dependency mới).
- `app/cms/san-pham/_components/product-research-section.tsx` ghép vào `product-edit-screen.tsx`.

Tính năng AI: Nghiên cứu Sản phẩm (FR-6..FR-11)
- kind: `RESEARCH` + `PRODUCT_CATEGORY` (một lần gọi)   - Gắn với: productId
- Đích khi Duyệt: `ResearchProfile` (module `research`) — khoá `productId`; `Product.categoryId` (module `products`) — khoá `productId`
- Prompt: `modules/research/prompts/research-product.prompt.ts` — id `research.product`, version 1, profile `quality`
- Output: `researchOutputSchema` → payload `researchProfileSchema` (thêm `id` cho từng lựa chọn) + `productCategoryPayloadSchema`
- Hồ sơ phong cách: không (chưa có `style-profiles`, Epic 5)
- images: có (ảnh đại diện + ảnh Dữ liệu thô, tối đa 4) · webSearch: có — khi bị skipped: dải thông báo đầu thân thẻ (UX-DR45)
- HTML trong output: không
- Action tạo: `modules/suggestions/actions.ts` → `researchProduct`; route `/cms/san-pham/[id]`, `maxDuration` 120
- Màn hình: Chi tiết Sản phẩm — GENERATING / PENDING / FAILED / APPROVED / REJECTED (SUPERSEDED không hiện)

**4.3 — Duyệt, Từ chối, Tạo lại**

- `prisma/schema/research.prisma` (`ResearchProfile { productId @unique, data Json }`), migration `add_research_profile`.
- `modules/research/{constants,schema,service,cms-queries,actions,tags,types}.ts`: `upsertResearchProfileRecord` (gọi từ Duyệt), `saveResearchProfile` + `saveResearchProfileRecord` (sửa sau Duyệt), `getResearchProfileForCms`, `parseResearchPayload` / `parseProductCategoryPayload`.
- `modules/research/components/research-profile-form.client.tsx` (RHF, dùng cho cả Duyệt và sửa sau Duyệt), `research-profile-editor.client.tsx` (form + `saveResearchProfile`).
- `modules/suggestions/actions.ts`: `approveSuggestion`, `rejectSuggestion`; `modules/suggestions/components/regenerate-dialog.client.tsx` (chip "ngắn hơn", "vui hơn", "bỏ phần giá").

**4.4 — Tìm web và đọc ảnh**

- Cùng lần gọi của 4.2: `webSearch: true`, `images` từ `Product.image` + `rawImageUrls` (chỉ URL qua `isAllowedImageUrl`); `sources`, `skipped` ghi vào `Suggestion`; khu "Thông tin" hiện link nguồn; dải `skipped`.

**4.5 — Danh mục gợi ý**

- Payload `PRODUCT_CATEGORY` `{ categoryId, categoryName, reason }`, chỉ id có trong danh sách Danh mục gửi cho AI; `modules/products/service.ts` thêm `setProductCategoryRecord`; `modules/suggestions/components/category-suggestion-card.tsx` + `category-suggestion-actions.client.tsx` (không có Tạo lại); `product-edit-screen.tsx` khoá `ProductForm` theo `categoryId`.

**Harness test:** `vitest.config.ts`, `vitest.db.config.ts` ép `AI_PROVIDERS=fake`; `vitest.db.mocks.ts` mock `after()` của `next/server` xếp hàng vào `actionTest.afterCallbacks`, chạy bằng `runAfterCallbacks()`; `resetTestDb()` xoá trạng thái `fakeAi`, cooldown và hai bảng mới.

**Docs:** `docs/cong-thuc/chuyen-code-cu.md` (lib/ai.ts, app/cms/actions.ts đã chuyển; ngoại lệ hết hiệu lực), `docs/no-ky-thuat.md` ([NO-17], [NO-19], [NO-20] đóng; gỡ `openai`), `docs/nen-tang-ky-thuat/lop-ai.md` (lớp AI mới), `docs/kien-truc-codebase.md`.

## Tasks & Acceptance

**Execution:**
- [x] 4.1 `platform/ai` + nhà `claude -p` + giả lập; `checkPostSeo`; chuyển `createPost`, `runThreads`; gỡ OpenAI
- [x] 4.2 `Suggestion` + migration; `researchProduct` + `after()`; thẻ, badge, poller, indicator
- [x] 4.3 `ResearchProfile` + migration; Duyệt / Từ chối / Tạo lại; sửa sau Duyệt
- [x] 4.4 ảnh + tìm web, `sources`, `skipped`, dải thông báo
- [x] 4.5 `PRODUCT_CATEGORY`, thẻ Danh mục gợi ý, `setProductCategoryRecord`
- [x] Test cho mọi action/query/service/schema mới; docs

**Acceptance Criteria:**
- Given lượt hoàn tất, when chạy mọi lệnh Verification, then xanh; mỗi dòng Matrix có test tự động hoặc bước kiểm tay đã chạy (ghi báo cáo).
- Given `grep -rn "openai\|@/lib/" app modules platform components`, then rỗng; `lib/` không còn; `LEGACY_APP_FILES` rỗng.
- Given một lần gọi `claude -p` thật qua `ask`, then trả `data` đúng schema trong ≤ 90 giây (ghi kết quả).

## Spec Change Log

## Review Triage Log

### Quyết định tự chọn (cần Vinh xem lại)

1. **Chuyển hết code AI cũ ngay ở 4.1, gỡ gói `openai`.** AC 4.1 ghi `createPost` có AI và `runThreads` "giữ nguyên tới khi Epic 5 thay; gỡ `openai` ở story thay thế cuối của Epic 5". Lệnh chạy yêu cầu chuyển `lib/ai.ts` + action AI theo AD-17, và AD-10 cấm OpenAI ngoài `platform/ai`. Chọn: giữ nguyên **hành vi** (đồng bộ, không `Suggestion`) nhưng chạy trên `platform/ai` (`claude -p`); không còn code nào dùng `openai` nên gỡ luôn (ghi ở `docs/no-ky-thuat.md`).
2. **Vị trí tạm của hai tính năng cũ:** `createPost` → `modules/posts/actions.ts` (cạnh `createPostDraft` nó gọi), `runThreads` → `modules/content-sets/actions.ts` (prompt ở `content-sets` theo bảng `chuyen-code-cu.md`). Bảng AD-17 nói đích là `suggestions` (kind `WEB_POST`, `THREADS_POST`) — đó là việc của Epic 5; đặt vào `suggestions` lúc này phải import `schema.ts`/`actions.ts` của `posts` (AD-2 cấm). Hai tính năng này tạm trái AD-9 ("mọi đầu ra AI là `Suggestion`") tới Epic 5.
3. **Chưa bật nhà dự phòng** (spine Deferred "chọn ở 4.1"): khung chuyển nhà + cooldown có sẵn và có test; chọn nhà cụ thể cần Vinh trả lời Q3 của recon (dữ liệu Gemini free) và tạo key. Ghi `deferred-work.md`.
4. **Hạn 90 giây tính cho cả một lần `ask()`** (gồm thử lại parse và chuyển nhà), không phải 90 giây mỗi lần thử — để không vượt `maxDuration = 120`.
5. **`skipped` có `webSearch` cả khi đã tìm nhưng không ra nguồn hợp lệ nào** — để dải "AI không tìm thêm được nguồn trên web" hiện đúng UJ-1 lỗi (a).
6. **Ảnh cho `claude -p`:** tải tối đa 4 ảnh (ảnh đại diện + `rawImageUrls`, chỉ URL qua `isAllowedImageUrl`, ≤ 5 MB) vào thư mục tạm, bật công cụ `Read`; URL tương đối (`/uploads/…`) lấy qua `SITE_URL`. Không tải được ảnh nào → `skipped` có `images`.
7. **Cô lập tiến trình `claude`:** thư mục tạm riêng, `--restricted --safe-mode --no-session-persistence --permission-prompts none`, chỉ bật công cụ cần; tiến trình con không nhận `DATABASE_URL`, mật khẩu CMS, biến phiên `CLAUDE_CODE_*`.
8. **Model theo profile:** `fast` = `haiku` (chấm SEO, chuỗi Threads), `quality` = `sonnet` (nghiên cứu, viết bài), đổi qua env.
9. **Enum `SuggestionKind` chỉ có `RESEARCH`, `PRODUCT_CATEGORY`**; `contentSetId`, `inspirationId` là cột chưa có khoá ngoại (bảng chưa tồn tại) để CHECK "đúng một đích" đúng AC 4.2; partial unique index chỉ cho khoá `(kind, productId)`. Story tạo `ContentSet`/`Inspiration` thêm FK, giá trị enum và index khoá đích của mình.
10. **Thêm cột `Suggestion.errorMessage`** (VarChar 300) — không có trong danh sách cột của spine nhưng cần cho "FAILED kèm thông báo tiếng Việt" (AD-18); `riskWarnings` là `Json` mặc định `[]` (Epic 5 dùng).
11. **`ResearchProfile.data` là một cột Json** (Zod `researchProfileSchema`) thay vì nhiều cột; `productId` `@unique` nullable (hồ sơ từ Cảm hứng thêm ở Epic 10).
12. **Payload sau Duyệt giữ nguyên bản AI**; bản đã sửa nằm ở `ResearchProfile` (đích), `editedBeforeApproval` ghi có sửa hay không — giữ được bản gốc để so.
13. **Zod payload `PRODUCT_CATEGORY` đặt ở `research/prompts/research-product.prompt.ts`** (cùng lần gọi AI với hồ sơ), không ở `products` — `products` không có prompt nào cho việc này.
14. **Parse payload cho màn CMS qua `research/cms-queries.ts`** (`parseResearchPayload`, `parseProductCategoryPayload`): `suggestions/cms-queries.ts` không được import `prompts/` của module khác (AD-2 chỉ mở cho `suggestions/actions.ts`).
15. **Một action `researchProduct` cho cả "Nghiên cứu" và "Tạo lại"** (có chỉ dẫn tuỳ chọn); Tạo lại được từ Chờ duyệt, Lỗi, Đã từ chối; hồ sơ đã Duyệt thì không nghiên cứu lại (sửa trực tiếp hồ sơ). Từ chối hồ sơ không tự từ chối Danh mục gợi ý.
16. **Người đọc mục tiêu, Góc viết hiện dạng sửa được (tên + lý do/câu mở đầu), chưa có AudiencePicker/AnglePicker để chọn** — việc chọn phục vụ tạo Bộ nội dung (Epic 5). Form không thêm/xoá ý; đổi nhiều thì Tạo lại kèm chỉ dẫn.
17. **Form hồ sơ không dùng `CmsForm`** (nút Lưu dính đáy sẽ chồng nút Lưu của form Sản phẩm cùng màn); vẫn RHF + `zodResolver` + `UnsavedChangesGuard` + Toast.
18. **Duyệt Danh mục gợi ý → `ProductForm` khoá theo `categoryId`** để form hiện Danh mục mới (AD-12 chỉ đọc `defaultValues` lúc mount); đổi lại mất thay đổi chưa lưu trên form Sản phẩm (ghi `deferred-work.md`).
19. **Dải Thông tin không có nguồn:** AI chỉ được ghi ý có nguồn; link nguồn chỉ nhận http(s) (chặn `javascript:`), sai thì bỏ link.

### 2026-11-06 — Kiểm chứng gộp (trước review gộp)

- Lần gọi `claude -p` thật duy nhất của epic (chạy thẳng CLI với bộ cờ của adapter: `--output-format json --json-schema --safe-mode --restricted --permission-prompts none --tools ""`, model `haiku`): exit 0, trả JSON kết quả trong ~2 giây.
- Gọi qua adapter với model không tồn tại (không tốn token) phát hiện và đã sửa hai lỗi gốc, có test chặn tái phát: (1) `claude --json-schema` từ chối khoá `"$schema"` draft 2020-12 mà `z.toJSONSchema` sinh ra → `ask()` bỏ khoá này; (2) adapter chuyển biến phiên `CLAUDE_CODE_*` cho tiến trình con → chỉ còn `CLAUDE_CONFIG_DIR`, `ANTHROPIC_*`. Sau sửa, lỗi API (`unrecognized_model`) được đọc đúng thành `ProviderError`.
- `npm start` cổng 3300 (`AI_PROVIDERS=fake`), `curl` có Basic Auth: Chi tiết Sản phẩm trả 200 ở ba trạng thái — chưa có hồ sơ (nút "Nghiên cứu"), Đang tạo ("Đang nghiên cứu…", "Đang chọn Danh mục…", `role="status"`), Chờ duyệt (dải "AI chưa đọc được ảnh…", "1 nguồn AI đã đọc", Duyệt / Từ chối / Tạo lại, thẻ Danh mục gợi ý). Dữ liệu thử chèn vào DB cục bộ đã xoá; server đã tắt.

## Verification

**Commands:**
- `npm test`; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- Một lần gọi `claude -p` thật (smoke), ghi thời gian và kết quả — đã chạy, xem Review Triage Log.
- Bấm "Nghiên cứu" thật trên `/cms/san-pham/[id]` với `AI_PROVIDERS=claude-cli` (chưa chạy: hết lượt gọi thật của epic) — rời màn, quay lại, Duyệt, Tạo lại.

**Kết quả (2026-11-06):** `npm test` 246/246 (23 file); `npm run test:db` 131/131 (15 file); `npx tsc --noEmit`, `npm run lint`, `npm run build` sạch; `grep "openai\|@/lib/"` trong `app modules platform components` rỗng (trừ test cấu hình sai `AI_PROVIDERS=openai`); `lib/` không còn; `LEGACY_APP_FILES` rỗng.
