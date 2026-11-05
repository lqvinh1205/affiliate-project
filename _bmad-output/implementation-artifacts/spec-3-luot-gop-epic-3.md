---
title: 'Lượt gộp Epic 3: Bài web hoàn chỉnh — Story 3.1–3.7'
type: 'feature'
created: '2026-11-05'
status: 'done'
review_loop_iteration: 0
baseline_revision: '8b27ad7c42b1539f08c6234044786cea1193d704'
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-4-2-8-luot-gop-epic-2.md'
  - '{project-root}/docs/cong-thuc/chuyen-code-cu.md'
  - '{project-root}/docs/cong-thuc/them-man-cms.md'
  - '{project-root}/docs/cong-thuc/them-trang-public.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
warnings: ['oversized', 'multiple-goals']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Màn bài viết CMS vẫn là code cũ dưới ngoại lệ AD-17 (route tiếng Anh `/cms`, `/cms/new`, `/cms/posts/[id]`, ô HTML thô, Sản phẩm chỉ đọc); chưa gắn được Sản phẩm từ kho, chưa xem trước, đổi slug làm gãy link; trang bài, trang chủ, 404/lỗi và nền SEO chưa theo UX. Epic 3 gồm Story 3.1–3.7 trong `_bmad-output/planning-artifacts/epics.md` (đọc nguyên văn từng story).

**Approach:** Một lượt triển khai theo thứ tự 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 (theo cách làm theo lượt Vinh yêu cầu 2026-11-05), rồi một lượt review/test gộp. Chuyển hết code cũ của màn bài viết sang `modules/posts` + `app/cms/bai-viet/**`, làm ngoại lệ AD-17 của trình soạn bài cũ hết hiệu lực.

## Boundaries & Constraints

**Always:** Mọi quy tắc spine và mẫu đã có ở Epic 2 (module AD-5, đường ghi AD-6 qua `run()`, đọc/cache AD-7 với tag mọi module, route mỏng AD-12, form AD-14 qua `CmsForm` + `UnsavedChangesGuard`, slug/308 AD-20 như `CategorySlugRedirect`, HTML AD-22 sanitize khi ghi và khi render, SEO AD-26); quyết định Vinh 2026-11-05: Bài web chỉ **chọn** Sản phẩm có sẵn (ProductPicker, chỉ Sản phẩm đang hiện), không tạo/sửa/xoá Sản phẩm, gỡ hay xoá bài không xoá Sản phẩm (FR-4); trình soạn thân bài dùng Tiptap (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, Vinh duyệt [QD-04] 2026-11-05) chỉ bật H2, H3, đoạn, danh sách, trích dẫn, đậm, nghiêng — tắt link, ảnh, bảng, code, heading khác; nhập/dán qua `sanitizePostHtml` trước khi lưu; khung test Server Action và `cacheTagsOf` đã có — mọi action/query mới có test; mỗi migration một story (3.4 `add_post_slug_redirect`), kiểm độ dài trước migration thu hẹp cột (`docs/kiem-chung.md`); chuyển file theo bảng `chuyen-code-cu.md`, sửa mọi import, cập nhật `LEGACY_APP_FILES`.

**Never:** Không làm phần AI mới: `createPost` có AI, `runThreads`, `runSeoCheck` và `lib/ai.ts` giữ nguyên chỗ cũ tới Epic 4 (`app/cms/actions.ts` chỉ còn các action AI đó; nút AI trên màn mới gọi chúng như cũ); không Banner, Xem nhiều, Gom link đồ xinh, LikeButton, ShareButtons, SearchBox (epic sau, không chừa chỗ trống); không đổi PRD/spine (chỉ thêm Tiptap vào bảng Stack của spine với ghi chú "Vinh duyệt 2026-11-05"); không sửa `AGENTS.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Route CMS cũ | `/cms`, `/cms/new`, `/cms/posts/x` | `/cms` 308 → `/cms/bai-viet`; hai route kia 404 | — |
| Lọc danh sách | `/cms/bai-viet?trang-thai=nhap` | chỉ bài Nháp; rỗng/lọc không ra theo DataList | — |
| Xuất bản / về nháp / xoá | qua nút; xoá qua ConfirmDialog | `updateTag` posts (+ categories, products khi liên quan); xoá giữ Sản phẩm | bài không nội dung → `UserError` |
| Gắn Sản phẩm | tìm "nồi" trong ProductPicker | chỉ Sản phẩm đang hiện; thêm, lên/xuống, gỡ; lưu đúng thứ tự `PostProduct` | gỡ không xoá Sản phẩm |
| Dán HTML lạ | dán `<a>`, `<img>`, `<script>`, `<table>` | không còn trong nội dung lưu | — |
| Xem trước | thay đổi chưa lưu → "Xem trước" | PreviewSheet render đúng component trang public, nhãn "Bản xem trước" | — |
| Đổi slug đã xuất bản | `a` → `b` → `c` | `/bai-viet/a`, `/bai-viet/b` 308 → `/bai-viet/c` | slug trùng bài khác → `UserError` |
| Slug không tồn tại | `/bai-viet/khong-co` | 404 | — |
| Trang bài | bài có ≥2 h2, Sản phẩm | thứ tự khu theo Story 3.5; TOC; RelatedPosts ≤3 cùng Danh mục | <2 h2 → ẩn TOC; 0 bài liên quan → ẩn khu |
| ArticleActionBar | mobile, bài có/không Sản phẩm | thay BottomTabBar; nút "Sản phẩm" cuộn tới khối / ẩn | — |
| Trang chủ | có bài | Bài nổi bật + Mới cập nhật (không trùng) + khu theo UX-DR62 | ảnh lỗi → ImageFallback |
| 404 site / CMS | đường dẫn lạ | "Trang này không còn ở đây" + Trang chủ / "Không tìm thấy. Có thể đã bị xoá." + danh sách | — |
| Lỗi bất ngờ | throw trong render | "Trang đang trục trặc một chút" + "Thử lại" + Trang chủ, không lộ chi tiết | — |

</intent-contract>

## Code Map

- **3.1:** `modules/posts/{schema,service,actions,cms-queries}.ts` — `setPostStatus`, `deletePost` chuyển từ `app/cms/actions.ts` (AD-17 theo action); `listPostsForCms({ status, q, page })`; `app/cms/bai-viet/{page, moi/page, [id]/page}.tsx` + `_components` (DataList như `/cms/san-pham`, StatusBadge Nháp/Đã xuất bản = `modules/posts/components/post-status-badge.tsx` chuyển từ `components/cms/status-badge.tsx`); `app/cms/page.tsx` → `permanentRedirect("/cms/bai-viet")`; xoá `app/cms/new`, `app/cms/posts`; CmsShell "Bài web" → `/cms/bai-viet`.
- **3.2:** `postInputSchema`, `newPostSchema` → `modules/posts/schema.ts` (giới hạn ở `modules/posts/constants.ts` — sửa [NO-12] tóm tắt 200 vs 500 theo AD-25, `productIds` có thứ tự); `savePost` → `modules/posts/actions.ts` + `savePostRecord` (ghi `PostProduct` theo thứ tự, không đụng `Product`); `components/cms/post-editor.tsx` → `modules/posts/components/post-form.client.tsx`, `new-post-form.tsx` → `new-post-form.client.tsx`, `fields.tsx` tách (`CategoryPicker` → `post-type-picker.client.tsx`, `CategorySelect` dùng `CategoryOption`), `seo-score.tsx` → `modules/posts/components/seo-score.tsx`; `modules/posts/components/post-body-editor.client.tsx` (Tiptap, thanh công cụ dính); `modules/products/components/product-picker.client.tsx` (tìm qua URL `?sp=` hoặc Combobox đọc `cms-queries` theo AD-12 — không action đọc; ảnh 40px, lên/xuống/gỡ 44px); `lib/post-input.ts` xoá khi rỗng; nút AI và chấm SEO gọi action cũ trong `app/cms/actions.ts`.
- **3.3:** `modules/posts/components/preview-sheet.client.tsx` dùng đúng component trang bài public (tách thân trang bài thành component dùng chung ở `modules/posts/components/post-article.tsx`), nhãn dính `inverse-surface`, sanitize phía client bằng cùng allowlist (hàm thuần trong `platform/html/sanitize.ts` dùng được ở client — nếu `sanitize-html` không chạy ở client thì Server Action xem trước chỉ đọc dữ liệu form, ghi lý do).
- **3.4:** `prisma/schema/posts.prisma` + migration `add_post_slug_redirect` (`PostSlugRedirect`, chủ `posts`); `savePostRecord` ghi lịch sử khi đổi slug bài đã xuất bản, cập nhật mọi bản cũ trỏ tới slug cuối; `getPostSlugRedirect` (cache, tag posts); `app/(site)/bai-viet/[slug]/page.tsx` tra lịch sử trước `<Suspense>`; test DB + kiểm `curl -I`.
- **3.5:** `modules/posts/components/{table-of-contents, article-body, post-tags, related-posts}.tsx`, `app/(site)/bai-viet/[slug]/_components/article-action-bar.client.tsx`; thứ tự khu theo Story 3.5; TOC từ `withHeadingIds` sau sanitize (mobile mở, desktop dính cột phải); RelatedPosts theo Danh mục; OpenGraph ảnh đại diện → ảnh Sản phẩm đầu tiên (qua `publicProductSelect`) → ảnh mặc định `platform/site`; JSON-LD `Article` + `BreadcrumbList`; BottomTabBar ẩn ở trang bài (đã có), ArticleActionBar thay.
- **3.6:** `app/(site)/_components/home-screen.tsx` theo UX-DR62 (mobile + desktop), PostCard biến thể featured/grid/row (`modules/posts/components/post-card.tsx`), skeleton cùng bố cục.
- **3.7:** `app/(site)/not-found.tsx` + `app/not-found.tsx` dùng `NotFoundScreen` (`app/(site)/_components/`), `app/cms/not-found.tsx` (đã có, sửa link về danh sách bài nếu phù hợp), `app/(site)/error.tsx`, `app/cms/error.tsx`, `app/global-error.tsx`; `app/layout.tsx` title template, OpenGraph mặc định, link "Bỏ qua tới nội dung"; sitemap/robots kiểm lại; rà UX-DR83, 87–92, 95, 97 trên các trang site.
- Docs: `docs/cong-thuc/chuyen-code-cu.md` (đánh dấu đã chuyển, xoá mục ngoại lệ AD-17 đã hết hiệu lực), `docs/kien-truc-codebase.md`, `docs/no-ky-thuat.md`, `docs/nen-tang-ky-thuat/giao-dien.md` (PostEditor, ProductPicker, PreviewSheet), spine bảng Stack (Tiptap).

## Tasks & Acceptance

**Execution:**
- [x] 3.1 danh sách + trạng thái, chuyển route
- [x] 3.2 soạn bài (Tiptap) + ProductPicker, chuyển editor
- [x] 3.3 xem trước
- [x] 3.4 đổi slug + migration + 308
- [x] 3.5 trang bài hoàn chỉnh
- [x] 3.6 trang chủ
- [x] 3.7 404/lỗi/nền SEO
- [x] Test cho mọi action/query/route mới; docs

**Acceptance Criteria:**
- Given lượt hoàn tất, when chạy mọi lệnh Verification, then xanh; mỗi dòng Matrix có test tự động hoặc bước kiểm tay đã chạy (ghi báo cáo).
- Given `npm run build && npm start`, when duyệt site và CMS ở 360px và 1280px (sáng/tối), then đúng AC từng story trong `epics.md`; `ls lib` chỉ còn `ai.ts` (và file AI liên quan nếu có).

## Spec Change Log

## Review Triage Log

### 2026-11-05 — Review gộp Epic 3 (diff từ 8b27ad7)
- verdicts: 57 findings — high 0, medium 9, low 33, false 15, maybe-false 0
- Route `patch` (một lượt sửa + lượt kiểm chứng HTTP/trình duyệt):
  - `[medium]` Lưu được bài đã xuất bản với thân rỗng; chặn xuất bản chỉ xét `trim()` (Blind, Edge)
  - `[medium]` Bài không có Sản phẩm trên mobile không còn thanh điều hướng; fallback Suspense chồng thanh (Blind)
  - `[medium]` Bản nháp AI bị loại cả bài khi tag/tiêu đề vượt giới hạn; chủ đề không giới hạn (Blind, Edge)
  - `[medium]` `app/cms/actions.ts` import `service.ts` của posts (AD-2) (Quy ước)
  - `[medium]` Ngày `Date` qua ranh giới client (AD-8) (Quy ước)
  - `[medium]` Form tạo bài 4 trường không dùng RHF (AD-14) (Quy ước)
  - `[medium]` Tiêu chí HTTP/trình duyệt chưa chạy thật: 308/404/307, giao diện 360/1280, Lighthouse (Intent) — lượt kiểm chứng cuối
  - `[medium]` `post-form.client.tsx` 554 dòng ([QU-28])
  - `[medium]` Docs `chuyen-code-cu.md`/`kien-truc-codebase.md` còn mô tả code đã gỡ, ngoại lệ 2.3 chưa đóng
  - `[low]` × 24: dán h1/h5/div mất cấu trúc; `/cms` dùng 308; xem trước thiếu ảnh fallback; hộp xác nhận dùng tiêu đề cũ; P2003 báo sai Danh mục; slug tự sinh vượt giới hạn; `setPostStatus` P2025; id heading trùng id trang; picker hết chỗ do `take`; tag trùng hoa/thường; TOC trong PreviewSheet không cập nhật; phút đọc tính trước sanitize; thiếu test xoá/lưu bài không tồn tại; đặt tên `searchProductsForPicker`/`postDraftSchema`/`newPostSchema`/`freePostSlug`; `post-list-screen.tsx` dài; `ArticlePost` gõ tay; template literal class; alias màu cũ; `CmsPost` thừa; `slug` thừa; spine thiếu Tiptap; styleguide thiếu mẫu
- Route `defer`:
  - `[low]` Metadata OpenGraph trang bài (ảnh mặc định, `url`) chưa test — chưa có cách test module page
  - `[low]` `PostSlugRedirect.oldSlug` không có ràng buộc DB chống trùng slug sống — chặn ở service; một người vận hành
- Route `reject`:
  - `[false]` Allowlist hẹp xoá bảng/hình của bài cũ — DB cục bộ 0 bài dùng thẻ đó, seed không dùng; thêm bước kiểm production vào `kiem-chung.md`
  - `[false]` Route CMS cũ nên chuyển hướng — AC 3.1 ghi rõ "route cũ trả 404"
  - `[false]` `app/cms/actions.ts` bị chạm mà không chuyển — phần AI giữ tới Epic 4 theo quyết định
  - `[false]` Sitemap chỉ Danh mục có bài, ảnh hero dùng fallback — đúng quyết định Epic 2 và FR-26
  - `[false]` × 11 khác (bản xem trước bỏ RelatedPosts, tag cache đã test, sanitize-html ở client đã build được…)

## Verification

**Commands:**
- `npm test`; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng trống (không dùng 3100, 3200): các dòng UI của Matrix; `curl -I` cho 308/404; Lighthouse mobile trang bài (ghi điểm CWV vào báo cáo nếu chạy được headless).
</content>
</invoke>

## Auto Run Result

Status: done

**Thay đổi:**
- **3.1:** danh sách bài ở `/cms/bai-viet`, lọc theo trạng thái, xuất bản/về nháp/xoá trong `modules/posts`. `/cms` chuyển hướng 307; `/cms/new`, `/cms/posts/*` trả 404.
- **3.2:** trình soạn Tiptap (chỉ có các định dạng sanitize cho phép), ProductPicker chọn Sản phẩm từ kho có thứ tự, `savePost` và `createPostDraft` chuyển vào `modules/posts`.
- **3.3:** PreviewSheet dùng đúng `PostArticle` của trang public.
- **3.4:** `PostSlugRedirect`; đổi slug nhiều lần thì mọi slug cũ đều trả 308 tới slug cuối.
- **3.5:** trang bài đủ các khu: TOC, ArticleActionBar, RelatedPosts theo Danh mục, JSON-LD, OpenGraph có ảnh dự phòng.
- **3.6:** trang chủ có Bài nổi bật và Mới cập nhật.
- **3.7:** trang 404 cho site và CMS, `error.tsx`, `global-error.tsx`, link "Bỏ qua tới nội dung", title template.
- `lib/` chỉ còn `ai.ts`. Ngoại lệ AD-17 của Story 2.3 đã đóng; phần AI giữ chỗ cũ tới Epic 4.

**Review gộp:** 57 phát hiện (medium 9, low 33, false 15). Đã sửa mọi mục được xếp vào nhóm sửa. Để lại 2 mục: chưa test metadata OpenGraph, và DB chưa có ràng buộc chống slug cũ trùng slug đang dùng.

**Có cần review lần nữa không:** không (`false`). Không có mục high nào; các mục medium đã được kiểm chứng lại bằng HTTP và trình duyệt.

**Kiểm chứng:**
- `npm test`: 212 test xanh. `npm run test:db`: 99 test xanh.
- `tsc`, `lint`, `build`: sạch.
- `curl -I`: `/cms` 307; `/cms/new`, `/cms/posts/x` 404; slug cũ 308 sau khi đổi slug qua action thật (đã đổi lại như cũ); slug lạ 404; CMS không auth 401.
- Ảnh chụp 360px và 1280px, sáng và tối: thứ tự khu đúng Story 3.5, không cuộn ngang, không trùng id.
- Lighthouse mobile trang bài: Performance 94, Accessibility 100, Best Practices 100, SEO 100.

**Rủi ro còn lại:**
- LCP 3.0 s, chậm hơn ngưỡng "Tốt" 2.5 s của AC CWV (Story 3.5); cần tối ưu riêng.
- Trong quá trình kiểm chứng, subagent đã in tài khoản admin dev cục bộ ra log công cụ; nên đổi mật khẩu.
- Chưa thao tác thật với danh sách kết quả của picker và TOC trong bản xem trước.
