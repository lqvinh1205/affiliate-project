---
title: 'Lượt gộp Epic 7: Đo Lượt xem — Story 7.1–7.2'
type: 'feature'
created: '2026-11-06'
status: 'done'
review_loop_iteration: 0
baseline_revision: '5f6499109d1855c842e4c118a6256697d57787f2'
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-3-luot-gop-epic-3.md'
  - '{project-root}/docs/cong-thuc/them-server-action.md'
  - '{project-root}/docs/cong-thuc/doi-schema.md'
  - '{project-root}/docs/cong-thuc/them-man-cms.md'
  - '{project-root}/docs/nen-tang-ky-thuat/nextjs-16.md'
warnings: ['multiple-goals']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Chưa đo được Lượt xem: Vinh không biết bài nào, loại bài nào kéo người đọc (SM-4); `/cms/bai-viet` không có cột Lượt xem, không sắp xếp theo Lượt xem. Epic 7 gồm Story 7.1–7.2 trong `_bmad-output/planning-artifacts/epics.md` (đọc nguyên văn từng story).

**Approach:** Một lượt triển khai 7.1 → 7.2, rồi một lượt kiểm chứng gộp (cách làm theo lượt, Vinh 2026-11-05). Dựng module `engagement` (T3) theo spine AD-6 (ngoại lệ số 1), AD-23: bảng `PostStat`, `PostViewDaily`; action công khai ghi Lượt xem có validate, bỏ qua bot, giới hạn tần suất theo băm IP trong bộ nhớ; client gửi một lần mỗi trình duyệt mỗi bài (`localStorage`), trình duyệt đã vào `/cms` không gửi. Query xếp theo Lượt xem ở `engagement` dùng lại bộ lọc/cột của `posts`.

## Boundaries & Constraints

**Always:** Spine AD-2 (tầng, đọc chéo bảng qua điều kiện/select của module chủ), AD-4 (bảng của `engagement`, `Post` chỉ thêm quan hệ ngược), AD-5, AD-6 (ngoại lệ số 1: không `run()`, validate, giới hạn tần suất, không `updateTag`), AD-7 (trang bài vẫn tĩnh, dữ liệu theo request lấy phía client), AD-8 (`*.client.tsx` chỉ gọi action), AD-12 (sắp xếp trên URL), AD-23, AD-27 (`formatCount`); không lưu/log IP hay định danh (NFR-7, [QD-18]); mọi action/query mới có test DB.

**Never:** Không hiện số Lượt xem trên site public (UX Q5); không cookie; không đọc `headers()`/`searchParams` trong `(site)`; không `updateTag` khi ghi lượt xem; không `console.error` trong action công khai; không làm Lượt tim, "Xem nhiều", cột Lượt tim (Epic 8, không chừa chỗ trống); không thêm thư viện npm; không sửa PRD/spine/`AGENTS.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Người đọc mở bài lần đầu | trang bài đã xuất bản, trình duyệt chưa có `luot-xem:<postId>` | lúc trình duyệt rảnh gửi `recordPostView`; `PostStat.views` +1 (tạo lười), `PostViewDaily` ngày Việt Nam +1; đặt `luot-xem:<postId>` | mất mạng → bỏ qua, không đánh dấu |
| Mở lại cùng bài | đã có `luot-xem:<postId>` | không gửi | — |
| Trình duyệt của Vinh | đã vào `/cms` (`trinh-duyet-cms` = 1) | không gửi lượt xem | — |
| `localStorage` bị chặn | đọc ném lỗi | không gửi (không chống trùng được) | — |
| Bot | user-agent Googlebot, HeadlessChrome, curl…, hoặc thiếu | `{ ok: true, counted: false }`, không ghi | — |
| Bài nháp / không tồn tại | `postId` uuid hợp lệ | `{ ok: true, counted: false }`, không ghi | — |
| Input sai | `postId` không phải uuid | `{ ok: false, error: "Dữ liệu không hợp lệ" }` | — |
| Dội | > 60 lần/phút cùng IP | lần thứ 61 `{ ok: false, error: "Thao tác quá nhanh, thử lại sau" }`; client không đánh dấu, lần mở sau gửi lại; IP khác không ảnh hưởng | — |
| Ghi lượt xem | bất kỳ | không đổi `Post.updatedAt`, không `updateTag`; trang bài vẫn `○` khi build | lỗi DB → `UNEXPECTED_ERROR`, không log |
| CMS danh sách | `/cms/bai-viet` | cột "Lượt xem" (desktop), "N lượt xem" trong meta thẻ (mobile), `formatCount`; bài chưa có lượt xem = 0 | — |
| Sắp theo Lượt xem | `?sap-xep=luot-xem` (giữ `trang-thai`, `q`) | giảm dần theo Lượt xem; bài 0 lượt / chưa có `PostStat` sau cùng theo sửa gần nhất; phân trang đúng qua ranh giới | `?trang` vượt → kẹp trang cuối |

</intent-contract>

## Code Map

- **7.1:**
  - `prisma/schema/engagement.prisma` + migration `20261106130000_add_post_stats` (`PostStat` khoá chính `postId`, `PostViewDaily` khoá `(postId, day)` `@db.Date`; FK `Cascade`); `posts.prisma` thêm quan hệ ngược `stat`, `viewDays`.
  - `platform/rate-limit.ts` (`createRateLimiter`, `clientKey`), `platform/bot.ts` (`isBotUserAgent`), `platform/format.ts` thêm `formatCount`, `vietnamDay`; test đơn vị cạnh nguồn.
  - `modules/posts/queries.ts`: xuất `publishedPostWhere` (đổi tên hằng `published` nội bộ) để `engagement` dùng lại (AD-2).
  - `modules/engagement/{constants,schema,service,actions}.ts`; `components/post-view-tracker.client.tsx` (đặt trong `app/(site)/bai-viet/[slug]/_components/post-screen.tsx`), `components/owner-browser-mark.client.tsx` (đặt trong `app/cms/layout.tsx`).
  - `vitest.db.mocks.ts`/`vitest.db.helpers.ts`: `actionTest.requestHeaders` (user-agent, IP cho action công khai); TRUNCATE thêm `PostViewDaily`, `PostStat`.
- **7.2:**
  - `modules/posts/cms-queries.ts`: tách `cmsPostListWhere`, `cmsPostListSelect`, `cmsPostListOrder`, `clampCmsPostPage` (xuất cho `engagement`); `listPostsForCms` dùng lại, hành vi không đổi.
  - `modules/engagement/{cms-queries,types}.ts`: `getPostViewsForCms`, `listPostsByViewsForCms`, `CmsPostWithViews`.
  - `app/cms/bai-viet/_components/`: `post-list-params.ts` (`SORT_PARAM` = `sap-xep`, `SORT_BY_VIEWS` = `luot-xem`, `byViews`), `post-sort-tabs.tsx` (mới), `post-search-form.tsx` (giữ sắp xếp), `post-list-screen.tsx` (`loadPage` ghép Lượt xem, cột Lượt xem).
- Docs: `docs/kien-truc-codebase.md` (module `engagement`, `platform/rate-limit`, `platform/bot`, `formatCount`), `docs/nen-tang-ky-thuat/{nextjs-16,giao-dien,prisma-7}.md` (bỏ ghi chú "đích, chưa có" cho phần đã dựng).

```text
Action: recordPostView
- Module chủ: engagement            - File: modules/engagement/actions.ts
- Loại: ngoại lệ AD-6 số 1 (engagement)
- Input: recordPostViewInputSchema trong modules/engagement/schema.ts — trường: postId: z.uuid()
- Output: Result<{ counted: boolean }>
- Quyền: công khai (người đọc chưa đăng nhập — AD-6); bỏ qua bot (user-agent); giới hạn 60 lần/phút theo băm IP trong bộ nhớ (AD-23)
- Service gọi tới: engagement/service.ts → recordPostViewRecord
- Bảng ghi: PostStat, PostViewDaily — chủ là engagement (AD-4); đọc Post (chỉ đọc, qua publishedPostWhere)
- updateTag: không (ngoại lệ số 1)
- Lỗi trả: "Dữ liệu không hợp lệ", "Thao tác quá nhanh, thử lại sau", UNEXPECTED_ERROR
- Gọi từ: modules/engagement/components/post-view-tracker.client.tsx (trang bài)
```

```text
Query: getPostViewsForCms(postIds) (cms-queries.ts)
- Module: engagement                 - Trả về: Record<postId, views> (thiếu PostStat = 0)
- Gọi từ: app/cms/bai-viet/_components/post-list-screen.tsx (sắp mặc định)

Query: listPostsByViewsForCms({ status, q, page }) (cms-queries.ts)
- Module: engagement (chạm Post + PostStat — AD-2)   - Trả về: { items: CmsPostWithViews[], total, page }
- Bộ lọc/cột/thứ tự phụ: cmsPostListWhere, cmsPostListSelect, cmsPostListOrder của posts/cms-queries.ts
- Gọi từ: app/cms/bai-viet/_components/post-list-screen.tsx (`?sap-xep=luot-xem`)
```

**Bảng phân tích ảnh hưởng schema (doi-schema.md Bước 2):**

| Hạng mục | File / ký hiệu bị ảnh hưởng | Việc phải làm |
|---|---|---|
| Query public | không có (Lượt xem không vào query public ở epic này) | — |
| Query CMS | `engagement/cms-queries.ts` (mới); `posts/cms-queries.ts` không đổi select | — |
| Kiểu | `engagement/types.ts` (mới) | — |
| Validate + form | `engagement/schema.ts` (mới), không có form | — |
| Ghi | `engagement/service.ts`, `actions.ts` (mới) | — |
| Cache tag | không có (không query public, không `updateTag`) | — |
| Module khác đọc | `Post` thêm quan hệ ngược `stat`, `viewDays` (không tạo cột) | — |
| Seed | không có (thiếu `PostStat` = 0) | — |
| Test | `engagement/*.db.test.ts`, TRUNCATE trong `vitest.db.helpers.ts` | đã thêm |
| Code cũ | không có | — |

Phân loại: **an toàn** (thêm bảng, index); không xoá/đổi tên cột, không đổi `onDelete` của bảng có sẵn. Production: Vinh chạy `npx prisma migrate deploy`.

## Tasks & Acceptance

**Execution:**
- [x] 7.1 bảng + migration `add_post_stats`, `platform/rate-limit`, `platform/bot`, `formatCount`/`vietnamDay`, action `recordPostView`, `PostViewTracker` trên trang bài, `OwnerBrowserMark` ở layout CMS
- [x] 7.2 query `engagement` (Lượt xem theo id, danh sách xếp theo Lượt xem), cột Lượt xem + sắp xếp `?sap-xep=luot-xem` ở `/cms/bai-viet`
- [x] Test cho mọi action/query/hàm thuần mới; khung test thêm `requestHeaders`; docs
- [x] Kiểm tay (`next start -p 3300`, Chrome headless): xem bài lần đầu → `PostStat.views` = 1, `PostViewDaily` ngày 2026-11-06 = 1; mở lại cùng hồ sơ trình duyệt → vẫn 1; HeadlessChrome UA (bot) → vẫn 1; hồ sơ đã vào `/cms` rồi mở bài → vẫn 1; `/cms/bai-viet?sap-xep=luot-xem` có Basic Auth hiện "Lượt xem nhiều nhất", cột Lượt xem, "1 lượt xem"; không auth 401. Ảnh 360px/1280px đã xem. Dữ liệu thử trên DB cục bộ đã xoá.

**Acceptance Criteria:**
- Given lượt hoàn tất, when chạy mọi lệnh Verification, then xanh; mỗi dòng Matrix có test tự động hoặc bước kiểm tay đã chạy.
- Given `npm run build`, when xem bảng route, then `/bai-viet/[slug]` vẫn tĩnh (`○`/`◐` như trước).
- Given `/cms/bai-viet` ở 360px và 1280px, then đúng AC Story 7.2 trong `epics.md`.

## Spec Change Log

## Review Triage Log

### Quyết định tự chọn (cần Vinh xem lại)

1. **Mức giới hạn tần suất Lượt xem: 60 lần/phút mỗi nguồn (băm IP)** (`VIEW_RATE_LIMIT`, Deferred của spine giao story chốt). Lý do: người đọc thật gửi tối đa một lần mỗi bài nhờ `localStorage`; nhiều người đọc Việt Nam dùng chung IP (NAT mạng di động, wifi quán) nên để rộng hơn mức thả tim của Epic 8 (≤ 30/phút) mà vẫn chặn script dội. Cửa sổ cố định 1 phút, đếm trong bộ nhớ tiến trình (spine giả định một tiến trình).
2. **Khoá IP:** SHA-256 của IP trong `x-forwarded-for` trộn muối ngẫu nhiên tạo mỗi lần khởi động, cắt 22 ký tự; không có header IP thì dùng chung khoá "unknown". Khi đưa lên máy thật, reverse proxy phải đặt `x-forwarded-for` (ghi chú cho story triển khai). (Review gộp sửa: lấy mục **cuối**, không đọc `x-real-ip` — xem quyết định 15.)
3. **Action nhận `postId` (uuid), không nhận slug** (ví dụ [NX-35] dùng slug): id không đổi khi đổi slug (FR-27), nên chống trùng `localStorage` và số đếm không tách đôi sau đổi slug. Khoá `localStorage`: `luot-xem:<postId>`, đánh dấu chủ: `trinh-duyet-cms`.
4. **Bỏ qua bot ở server** (`platform/bot.ts`, regex user-agent phổ biến + thiếu user-agent) trả `counted: false`, client vẫn đánh dấu; không coi trình duyệt trong app Zalo/Facebook/Threads là bot (người đọc thật từ MXH).
5. **Giới hạn tần suất / mất mạng → client không đánh dấu** để lần mở sau gửi lại; bài nháp / không có → `counted: false`, client đánh dấu (không gửi lại vô ích).
6. **`localStorage` bị chặn → không gửi** (không chống trùng được; thà thiếu hơn đếm trùng).
7. **Gửi lúc rảnh** (`requestIdleCallback`, trần 3 giây; trình duyệt không có thì `setTimeout` 1 giây) để không tranh tài nguyên với nội dung chính (NFR-5). Component không hiện gì (UX Q5).
8. **`OwnerBrowserMark` đặt ở `app/cms/layout.tsx`** (mọi màn CMS sau Basic Auth); trình duyệt chưa từng vào `/cms` của Vinh (vd điện thoại mới) vẫn bị đếm tới khi vào CMS một lần.
9. **`PostStat` khoá chính là `postId`** (không có cột `id` uuid như quy ước chung) — đúng dạng `{ postId, views, likes }` của spine, quan hệ 1–1 với `Post`; `PostViewDaily` khoá ghép `(postId, day)`, `day` là `@db.Date` theo ngày Việt Nam (`vietnamDay`). Cả hai `onDelete: Cascade` (xoá bài thì xoá số đếm — bảng mới, không phá dữ liệu có sẵn). Thêm index `PostStat.views`, `PostViewDaily.day` cho sắp xếp và cửa sổ 30 ngày (Epic 8).
10. **Sắp xếp theo Lượt xem ghép hai đoạn** (bài có lượt xem > 0 giảm dần, rồi bài 0/chưa có `PostStat` theo sửa gần nhất): Prisma không cho đặt NULL cuối khi sắp theo quan hệ tuỳ chọn, Postgres `DESC` để NULL lên đầu. Cùng Lượt xem thì sửa gần nhất trước. Chỉ có chiều giảm dần (không có "ít nhất").
11. **Giao diện sắp xếp:** hàng pill "Sắp xếp: Sửa gần nhất | Lượt xem nhiều nhất" dưới ô tìm (cùng kiểu với lọc trạng thái), tham số `?sap-xep=luot-xem`, mặc định không có tham số; đổi sắp xếp về trang 1, giữ lọc và từ khoá; không tính là "bộ lọc" cho thông báo "Không có kết quả với bộ lọc này". Mobile: "N lượt xem" cuối dòng meta (khoảng trắng không ngắt).
12. **Hàm chung ở `platform/`:** `rate-limit.ts` (Epic 8 thả tim và `posts.searchPosts` dùng lại), `bot.ts`; `formatCount`, `vietnamDay` ở `platform/format.ts` (AD-27).
13. **`posts` xuất thêm** `publishedPostWhere` (`queries.ts`) và `cmsPostListWhere`/`cmsPostListSelect`/`cmsPostListOrder`/`clampCmsPostPage` (`cms-queries.ts`) để `engagement` không viết lại điều kiện (AD-2 "Đọc chéo bảng").
14. **Migration đặt tên `20261106130000_add_post_stats`** (đổi mốc giờ của thư mục do Prisma sinh) để xếp sau `20261106120000_bio_pinned_at_untie_product_created_at` (mốc viết tay của Epic 6).
15. **(Review gộp) IP cho khoá giới hạn = mục cuối của `x-forwarded-for`, không cấu hình số tầng proxy.** Lý do: Next chỉ điền header khi thiếu (`??=` IP socket), nginx `$proxy_add_x_forwarded_for` nối IP thật vào cuối → mục cuối đúng với cả hai cách chạy một tầng; mục đầu và `x-real-ip` client tự đặt được. Spine chưa chốt hạ tầng (Deferred "Hạ tầng production"), nên không thêm biến môi trường "số tầng proxy tin cậy" khi chưa có CDN — ghi vào `deferred-work.md` (CDN + nginx thì mục cuối là IP CDN).
16. **(Review gộp) Trần bộ đếm `MAX_KEYS` = 10 000 khoá, đầy thì bỏ khoá cũ nhất** (Map giữ thứ tự chèn, khoá mở cửa sổ mới được chèn lại), dọn khoá hết hạn tối đa một lần mỗi cửa sổ. Chọn bỏ khoá cũ thay vì từ chối khi đầy: từ chối sẽ chặn cả người đọc thật khi bị dội; bỏ khoá cũ chỉ làm một nguồn đã im lâu nhất được đếm lại.
17. **(Review gộp) Nhận diện bot:** `bot` chỉ khớp khi theo sau là `/`, `;`, `)`, `-` hoặc hết chuỗi (đuôi tên crawler); Pinterest chỉ khớp `Pinterestbot`/`Pinterest/0.` — trình duyệt trong app Pinterest và máy Cubot được đếm. Không chuyển sang danh sách token cố định (dễ sót crawler mới tên `…bot/`).
18. **(Review gộp) Luật gửi/đánh dấu của `PostViewTracker` tách sang `modules/engagement/view-dedupe.ts`** (hàm thuần `shouldSendView`, `shouldMarkViewed`, tiền lệ `bio/browse.ts`) để test đơn vị trong môi trường node; không thêm jsdom/Testing Library (spine/UX/PRD không nêu thư viện này). Guard `sent` chống gửi lại khi `<Activity>` hiện lại vẫn chỉ kiểm tay.

### 2026-11-06 — Review gộp Epic 7: phân loại

| # | Phát hiện | Quyết định | Lý do / việc đã làm |
|---|---|---|---|
| 1 | Khoá giới hạn lấy mục đầu `x-forwarded-for` do client đặt → dội Lượt xem không giới hạn (trung bình) | Sửa | Đúng: `base-server.js` chỉ `??=` IP socket. `clientKey` lấy mục cuối, bỏ `x-real-ip` (quyết định 15). Test đơn vị: mục đầu giả khác nhau → cùng khoá, `x-real-ip` bị bỏ qua; test DB: 60 lần với mục đầu đổi mỗi lần → lần 61 vẫn `RATE_LIMITED_ERROR`. Phần CDN nhiều tầng hoãn (`deferred-work.md`). |
| 2 | Map bộ đếm không có trần khi khoá còn hiệu lực; ≥ 10 000 khoá thì mọi lần gọi quét cả Map (trung bình) | Sửa | Trần `MAX_KEYS`, đầy bỏ khoá cũ nhất (O(1)); dọn khoá hết hạn theo mốc `nextPruneAt` một lần mỗi cửa sổ (quyết định 16). Test: đầy bỏ đúng khoá cũ nhất, khoá còn lại giữ số đếm; khoá mở cửa sổ mới tính là mới nhất. |
| 3 | Regex bot khớp người đọc thật (trình duyệt trong app Pinterest, máy Cubot) (thấp) | Sửa | Thu hẹp `bot` và `pinterest` (quyết định 17). Test thêm người đọc: Cubot P50, `[Pinterest/Android]`, `[Pinterest/iOS]`; bot: Pinterestbot, `Pinterest/0.2`, TelegramBot, Slackbot-LinkExpanding. |
| 4 | Trùng #1 (cùng lỗi `x-forwarded-for`, kèm hệ quả quét O(n) của #2) (trung bình) | Sửa (gộp với #1, #2) | Cùng gốc; một lần sửa ở `platform/rate-limit.ts` dùng chung cho thả tim / tìm kiếm Epic 8. |
| 5 | Trùng #3 (regex bot) (thấp) | Sửa (gộp với #3) | Như #3; các UA trong phát hiện đã thành ca âm ở `platform/bot.test.ts`. |
| 6 | Luật chống trùng / bỏ qua trình duyệt CMS phía client không có test (thấp) | Sửa | Tách hàm thuần + `view-dedupe.test.ts`: gửi chỉ khi đọc được `localStorage`, không phải trình duyệt CMS, chưa xem; đánh dấu chỉ khi `ok` (giới hạn tần suất / lỗi → không đánh dấu) (quyết định 18). |

### Auto Run Result

- Sửa 6 (4, 5 gộp vào 1–3), hoãn 0 phát hiện (một phần việc hạ tầng CDN nhiều tầng ghi vào `deferred-work.md`), bác 0.
- `npm test` 330/330 (36 file); `npm run test:db` 184/184 (22 file); `npx tsc --noEmit`, `npm run lint`, `npm run build` sạch (`/bai-viet/[slug]` vẫn `◐`/`○`; cảnh báo Turbopack `child_process.spawn` của `claude-cli` có từ Epic 5).
- `next start` cổng 3300 (`AI_PROVIDERS=fake`): `/`, `/bio`, `/bai-viet/meo-tay-vet-o-vang-noi-chien-khong-dau`, `/sitemap.xml` 200; `/cms`, `/cms/bai-viet` không đăng nhập 401; có Basic Auth `/cms/bai-viet?sap-xep=luot-xem` 200. Server đã tắt; không đụng cổng 3100/3200.
- Không gọi `claude -p` thật (epic không có tính năng AI).
- Cần Vinh: xem Quyết định tự chọn (nhất là 1, 15, 16, 17); khi dựng máy thật cấu hình reverse proxy nối/ghi đè `X-Forwarded-For` (một tầng); chạy `npx prisma migrate deploy`.

## Verification

**Commands:**
- `npm test`; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- expected: xanh
- `npx tsc --noEmit`, `npm run lint`, `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng 3300+ (không dùng 3100, 3200): mở bài bằng trình duyệt thật → `PostStat` +1; mở lại không tăng; vào `/cms` rồi mở bài không tăng; `/cms/bai-viet?sap-xep=luot-xem` ở 360px/1280px.

**Kết quả sau review gộp (2026-11-06):** `npm test` 330/330; `npm run test:db` 184/184; tsc, lint, build sạch.

**Kết quả (mốc trước review gộp, 2026-11-06):** `npm test` 316/316 (35 file); `npm run test:db` 183/183 (22 file); `npx tsc --noEmit`, `npm run lint`, `npm run build` sạch (`/bai-viet/[slug]` vẫn prerender). Không gọi `claude -p` (epic không có tính năng AI).
