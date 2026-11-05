---
title: Review spine theo checklist — affiliate-project
target: ../ARCHITECTURE-SPINE.md
reviewed: 2026-11-03
inputs:
  - _bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md (+ addendum.md)
  - docs/kien-truc-codebase.md, docs/quy-uoc-code.md, docs/quy-dinh.md, docs/nen-tang-ky-thuat/*
  - code @ dfd7e8f (package.json, prisma/, prisma.config.ts, next.config.ts, lib/images.ts, .env.example, docker-compose.yml)
  - npm registry (npm view, 2026-11-03)
---

# Review spine — affiliate-project

## Kết luận

Spine có bộ khung tốt (module dọc, hợp đồng file, đường ghi/đọc, chủ bảng) và phần lớn Rule đủ cụ thể cho agent nhỏ, **nhưng chưa sẵn sàng làm nền cho epics**: còn bỏ ngỏ mô hình thực thi AI (NFR-3/FR-12), một số đường ghi xuyên module mà PRD bắt buộc lại không có lối hợp lệ theo AD-2/AD-9, tìm kiếm/phân trang/301 xung đột với `ensureStatic`, và companions đang mâu thuẫn trực tiếp với spine.

| Mức | Số lượng |
| --- | --- |
| Critical | 1 |
| High | 7 |
| Medium | 6 |
| Low | 7 |

## Điểm mạnh (giữ nguyên)

- AD-4 + AD-5 + AD-6 tạo đường ghi một chiều rất rõ: agent biết file nào được ghi, file nào được cache, file nào kiểm quyền.
- AD-7 xử lý đúng bẫy lớn nhất của brownfield: `ensureStatic = "navigation"` và tag đa module (giải quyết NFR-5/FR-5 "ẩn Sản phẩm" mà `POSTS_TAG` đơn hiện tại không làm được).
- AD-8 (`server-only`, `*.client.tsx`, `Date` → ISO) và AD-13 (`UserError`) là luật kiểm được bằng grep.
- AD-11, AD-15 có lối thoát rõ (`[COMPONENT-UNKNOWN]`, `[SCHEMA-UNKNOWN]`) thay vì để agent tự chế.
- Stack đã khớp đúng phiên bản đang cài (`node_modules`) và các gói "thêm mới" đều có thật trên npm (react-hook-form 7.91.0, @hookform/resolvers 7.0.1, server-only 0.0.1, vitest 5.1.0).
- Deferred phần lớn hợp lý và có mốc "quay lại khi" gắn với story cụ thể.

## Findings

### Critical

**C1. Mô hình thực thi AI chưa được quyết — mọi story AI sẽ tự chế.**
- PRD: NFR-3 (≤ 90 s, "rời màn hình rồi quay lại vẫn thấy kết quả"), FR-12 ("phần lỗi không mất, tạo lại riêng"), NFR-2 (dữ liệu đã nhập không mất). Addendum A3: Claude CLI "chậm, vài chục giây". Code hiện tại: `app/cms/layout.tsx` `maxDuration = 60`, gọi AI đồng bộ trong Server Action.
- Spine: AD-9 chỉ có `status` `PENDING/APPROVED/REJECTED` — không có trạng thái *đang tạo* / *lỗi*; AD-10 chỉ nói "không gọi AI trong transaction". Không nói AI chạy đồng bộ trong action hay nền (`after()`), client lấy kết quả thế nào (chờ response hay poll), timeout bao nhiêu.
- Hệ quả: story FR-6..FR-11 (nghiên cứu), FR-12..FR-17 (bộ nội dung), FR-21 (tạo lại) sẽ mỗi cái một cách: có cái chờ đồng bộ, có cái lưu bản ghi trước; FR-12 tạo 4 phần trong một lần dễ vượt 60–90 s.
- Sửa: thêm AD "Vòng đời lời gọi AI": action tạo `Suggestion` với `status = GENERATING` (thêm `FAILED` + `errorMessage`) rồi chạy AI trong `after()` (hoặc đồng bộ nếu chọn vậy — nhưng chọn một), mỗi phần của Bộ nội dung là một `Suggestion` riêng; màn hình đọc qua `cms-queries.ts` và poll/refresh; chốt timeout mỗi lời gọi và `maxDuration`. Ghi luôn quy tắc "một Suggestion lỗi không ảnh hưởng Suggestion khác".

### High

**H1. Companions mâu thuẫn trực tiếp với spine, không nói bên nào thắng.**
- `docs/kien-truc-codebase.md` [KT-01] "không đặt tag khác cho truy vấn bài" ↔ AD-7 (tag đa module); [KT-05] "chỉ đọc qua `lib/posts.ts`" ↔ AD-1/AD-7.
- `docs/quy-uoc-code.md` [QU-01] `components/site|cms`, [QU-02] "mọi Server Action trong `app/cms/actions.ts`", [QU-03] "`lib/` phẳng" ↔ AD-1, AD-5, AD-11.
- `docs/quy-dinh.md` [QD-20] "`run()` trong `app/cms/actions.ts`", [QD-12] `sanitizePostHtml` (tên/vị trí sẽ đổi sang `platform/html`).
- Spine liệt kê các file này là `companions`, nên agent đọc cả hai sẽ chia rẽ. [QD-22] xếp "tài liệu kiến trúc" trên code nhưng không nói gì về docs companions.
- Sửa: thêm một dòng trong spine: "Spine thay thế [KT-01], [KT-05], [QU-01]–[QU-03], [QD-20] (vị trí `run()`), [QD-12] (vị trí sanitize); khi mâu thuẫn, spine thắng". Thêm story trong epic đầu (AD-17) cập nhật các docs này.

**H2. AD-15 cấm thêm bảng/cột "ngoài spine" nhưng spine không có cột nào; ERD thiếu thực thể PRD bắt buộc.**
- Rule "Không tự thêm bảng/cột ngoài spine: `[SCHEMA-UNKNOWN]` và hỏi" không theo được: ERD chỉ có tên thực thể, nên **mọi** story có schema sẽ dừng hỏi, hoặc lờ luật.
- Thực thể/cột thiếu mà các story khác nhau sẽ tự chế khác nhau:
  - Lịch sử đường dẫn cho 301 (FR-27 bài, FR-28 Danh mục) — hai module, dễ ra hai bảng.
  - FR-34 "Xem nhiều 30 ngày": AD-15 chốt "Lượt xem nằm trong `PostStat`", nếu `PostStat` là một hàng/bài thì không tính được 30 ngày → cần bucket theo ngày (`PostDailyStat { postId, day, views }`) hoặc ghi rõ bỏ giả định 30 ngày.
  - FR-2: Hồ sơ nghiên cứu từ Cảm hứng — ERD chỉ có `Product ||--o{ ResearchProfile`.
  - FR-31: ghim/thứ tự/hiện trên bio — nằm trên `Product` hay bảng của `bio`? (liên quan H3).
  - Enum `Category` hiện có (Loại bài) trùng tên với model `Category` mới (Danh mục) — Prisma không cho cùng tên; tên mới của enum chưa chốt.
- Sửa: đổi luật thành "Không thêm **bảng** ngoài ERD; cột mới được thêm trong file `.prisma` của module chủ theo story". Bổ sung vào ERD: `SlugRedirect` (hoặc `PostSlugHistory` + `CategorySlugHistory`, chọn một), bucket lượt xem theo ngày, quan hệ `Inspiration → ResearchProfile`, tên enum Loại bài (ví dụ `PostType`), nơi lưu ghim/thứ tự bio.

**H3. Ghi xuyên module PRD bắt buộc nhưng AD-2/AD-4/AD-9 không cho lối hợp lệ.**
- FR-2: tạo Bộ nội dung từ Cảm hứng → Cảm hứng chuyển *đã dùng*. Bảng `Inspiration` thuộc `inspirations`; người tạo Bộ nội dung là `content-sets`/`suggestions`. AD-9 không liệt kê `inspirations` là module đích.
- FR-11: Duyệt "Danh mục gợi ý" phải ghi `categoryId` lên `Product`/`Post` (chủ: `products`/`posts`), nhưng AD-9 liệt kê đích là `categories` và **thiếu `products`**.
- FR-31: bio ghim/sắp xếp Sản phẩm — nếu dữ liệu nằm trên `Product`, `bio` sẽ ghi bảng của `products`.
- Hệ quả: agent hoặc vi phạm AD-2, hoặc mỗi người chế một "ngoại lệ".
- Sửa: sửa danh sách đích của AD-9 thành `posts`, `content-sets`, `research`, `products`, `inspirations` (bỏ `categories` nếu Danh mục gợi ý chỉ gán, không tạo mới); chốt rằng `content-sets/actions.ts` khi tạo từ Cảm hứng đi qua cùng ngoại lệ (hoặc chuyển việc đổi trạng thái Cảm hứng thành quyết định của `suggestions`); chốt chủ dữ liệu ghim bio (khuyến nghị: bảng `BioItem` thuộc `bio`).

**H4. Tìm kiếm (FR-36) và phân trang Danh mục (FR-29) xung đột với `ensureStatic = "navigation"`, spine không quyết.**
- `docs/nen-tang-ky-thuat/nextjs-16.md` [NX-03]: trong `(site)` cấm `searchParams` phía server kể cả trong `<Suspense>`. Spine đặt `tim-kiem` trong `app/(site)/` nhưng không nói truy vấn chạy ở đâu.
- AD-6 chỉ định nghĩa *ghi* công khai; một *đọc* công khai qua Server Action (cách khả thi nhất cho tìm kiếm) không có luật: có cần giới hạn tần suất? nằm ở `posts/actions.ts` hay `queries.ts`?
- So khớp không dấu ("noi chien" → "nồi chiên") cần quyết: cột chuẩn hoá do `slugify` sinh, hay extension `unaccent`/`pg_trgm` (cần SQL tay theo AD-15).
- Phân trang: dạng đường dẫn (`/[danh-muc]/trang/[n]` + `generateStaticParams`) hay tải thêm phía client — chưa chốt.
- Sửa: thêm AD "Đọc động trên site tĩnh": tìm kiếm = client component gọi Server Action đọc trong `modules/posts/actions.ts` (không cache, giới hạn tần suất như AD-6, `noindex`), tìm trên cột `searchText` chuẩn hoá; phân trang theo đường dẫn tĩnh.

**H5. Cơ chế chuyển hướng 301 (FR-27, FR-28) chưa quyết.**
- Hai story (đổi slug bài, đổi đường dẫn Danh mục) sẽ chọn khác nhau: `redirects()` trong `next.config.ts` (cần deploy lại — trái NFR-5), `proxy.ts` (đọc DB ở proxy, mở rộng matcher ra toàn site), hay tra bảng lịch sử trong `<…Screen>` rồi `permanentRedirect()` (phải hợp lệ dưới `ensureStatic` và `generateStaticParams`).
- Sửa: chốt một cơ chế (khuyến nghị: bảng lịch sử slug + `getRedirect(slug)` trong `queries.ts` có cache/tag, gọi trong screen trước `notFound()`), áp chung cho bài và Danh mục.

**H6. Đường upload file chưa có và AD-6 đang chặn phương án khả thi.**
- FR-1: video ~100 MB; FR-3: ảnh tải lên. Server Action mặc định giới hạn body 1 MB (`serverActions.bodySizeLimit`, `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`). AD-6 cấm Route Handler cho ghi nội bộ.
- Deferred "nơi lưu" là hợp lý, nhưng **hợp đồng** `platform/storage` (hàm gì, trả gì, URL có vào `IMAGE_HOSTS` không) và **đường đi của byte** (qua Server Action, Route Handler dưới `/cms`, hay upload thẳng lên storage bằng signed URL) là điểm phân nhánh giữa story FR-1 và FR-3.
- Sửa: thêm vào AD-6 ngoại lệ có tên cho upload (ví dụ Route Handler dưới `/cms/upload` có `requireAdmin`, hoặc signed URL), và chữ ký `platform/storage.put(file) → { url }` + luật "host của storage khai báo trong `platform/images.ts`".

**H7. Hợp đồng `ask()` chưa đủ để FR-6/FR-7/NFR-2 làm thống nhất trong khi nhà cung cấp còn hoãn.**
- AD-10: `ask({ prompt, input, images? })`. Không có: cờ yêu cầu tìm web (FR-6), cách trả **nguồn** từng ý (FR-6), tín hiệu "nhà hiện tại không đọc được ảnh, đã bỏ qua" (FR-7), lỗi khi mọi nhà lỗi là `UserError` hay lỗi khác (NFR-2 + AD-13), thử lại khi Zod sai.
- Deferred nói "tính năng không phụ thuộc lựa chọn", nhưng chỉ đúng khi hợp đồng đã chốt những điểm trên; nếu không, story FR-6 và FR-7 mỗi cái mở rộng `ask()` một kiểu.
- Sửa: chốt kiểu `ask<P>(def, input, opts?: { images?: string[]; webSearch?: boolean }) → Promise<{ data; sources?: {url,title}[]; skipped: ("images"|"webSearch")[] }>`; mọi lỗi cuối cùng ném `UserError("AI đang bận…")`; thử lại 1 lần khi Zod sai.

### Medium

**M1. Chuyển Prisma sang nhiều file chưa có trong kế hoạch di chuyển.**
- `prisma.config.ts` hiện `schema: "prisma/schema.prisma"`; AD-4 yêu cầu `prisma/schema/<module>.prisma` → phải đổi `schema` thành thư mục và chuyển `datasource`/`generator` vào một file chung. AD-17 liệt kê việc của epic đầu nhưng không có bước này; story đầu chạm schema sẽ tự làm, các story chạy song song có thể xung đột.
- Sửa: thêm vào danh sách epic đầu của AD-17: "tách `prisma/schema.prisma` thành `prisma/schema/` (file `_base.prisma` chứa generator/datasource), sửa `prisma.config.ts`", và ghi tên mới của enum Loại bài.

**M2. Luật làm mới cache còn mơ hồ.**
- AD-6 "`updateTag(<mọi tag bị ảnh hưởng>)`" — agent nhỏ không biết "bị ảnh hưởng" là gì. Với thiết kế AD-7 (query gắn tag mọi module nó đọc), đúng ra action chỉ cần `updateTag` tag của module **chủ bảng vừa ghi**.
- Truy vấn phụ thuộc thời gian (Banner theo khung giờ FR-32, "Xem nhiều" FR-34 khi action công khai không được `updateTag`) cần `cacheLife` ngắn; spine không nêu profile.
- Sửa: viết lại thành "action `updateTag` tag của mọi module mà nó ghi bảng (trong Duyệt: thêm tag của module đích)"; ghi `cacheLife` cho query theo thời gian (ví dụ `"minutes"`).

**M3. Cơ chế chống trùng/giới hạn tần suất công khai chưa quyết, chỉ hoãn con số.**
- FR-35 "mỗi trình duyệt một tim" (localStorage? cookie id ngẫu nhiên?), FR-35 giới hạn theo "nguồn" (IP là dữ liệu định danh — NFR-7, [QD-18]), FR-33 bỏ qua bot và Người vận hành. Deferred chỉ hoãn "mức cụ thể".
- Hai story (lượt xem, lượt tim) cùng module `engagement` nhưng có thể làm theo hai đợt (giai đoạn 1 và 1.5) → dễ ra hai cơ chế.
- Sửa: chốt trong AD-6: giới hạn trong bộ nhớ theo hash IP có muối xoay vòng, không lưu DB; dedupe tim bằng `localStorage`; định nghĩa bot bằng danh sách UA trong `platform/`.

**M4. AD-16 thiếu chi tiết để agent làm giống nhau.**
- "DB Postgres test cục bộ": dùng DB nào (cùng container cổng 54329, database `affiliate_test`?), reset thế nào (truncate mỗi file?) — nếu không chốt, agent có thể chạy test vào DB dev và xoá dữ liệu.
- `import "server-only"` ném lỗi khi chạy dưới Vitest nếu không alias/mock — mọi `service.ts` có test sẽ vướng.
- "Chế độ giả lập" của `platform/ai` bật bằng gì (tên biến env)?
- FR-23 yêu cầu bộ ≥ 20 câu đo tỉ lệ bắt/báo nhầm — cần gọi AI thật, mâu thuẫn "Không gọi AI thật".
- Sửa: chốt `DATABASE_URL_TEST`/database `affiliate_test`, alias `server-only` trong `vitest.config.ts`, `AI_MODE=mock`, và tách "bộ đánh giá FR-23" thành script chạy tay ngoài Vitest.

**M5. Capability map chưa phủ hết những gì `binds` tuyên bố.**
- `binds: NFR-1..NFR-11` nhưng map chỉ có NFR-1, 2, 6, 7, 9. Thiếu: NFR-3 (xem C1), NFR-4 (CMS mobile-first), NFR-5 (nằm trong AD-7 nhưng không ghi), NFR-8 (sitemap/JSON-LD/breadcrumb theo Danh mục: module nào sở hữu `app/sitemap.ts` khi đọc từ `posts` + `categories`?), NFR-10 (xoá `/styleguide`), NFR-11.
- FR-13 "chấm điểm SEO bằng AI vẫn dùng được": theo AD-9 "mọi đầu ra AI là `Suggestion`" thì báo cáo SEO cũng phải lưu `Suggestion`? Hiện code không lưu. Cần ghi ngoại lệ hoặc xác nhận.
- Sửa: bổ sung các dòng NFR vào map; thêm câu "đầu ra AI chỉ mang tính phân tích (điểm SEO) không phải `Suggestion`" nếu đúng ý.

**M6. Hạ tầng brownfield không được ratify hay lên kế hoạch thay: Supabase.**
- `.env.example` (pooler pgbouncer cổng 6543 + `DIRECT_URL`), `docker-compose.yml` ("production dùng Supabase"), `lib/images.ts` (`*.supabase.co`), comment `next.config.ts` ("upload lên Supabase Storage"), [QD-07] đều coi production là Supabase.
- Spine đặt "nơi chạy Postgres" và "nơi lưu ảnh" vào Deferred, giả định "một tiến trình trên một VPS", mà không nhắc Supabase. Agent sẽ hoặc giữ Supabase (đọc code) hoặc không (đọc spine). Hệ quả cụ thể: interactive transaction của AD-9 chạy qua pgbouncer transaction mode; `IMAGE_HOSTS` giữ hay bỏ `*.supabase.co`.
- Môi trường: spine chỉ có "dev"; Node production, nơi cài Claude CLI (nếu chọn) chưa có dòng nào — chấp nhận được khi chưa deploy, nhưng nên liệt kê các phụ thuộc "trong bộ nhớ tiến trình" (cooldown AI, rate limit) như ràng buộc cho bước deploy.
- Sửa: ghi rõ "Postgres production = Supabase free tier (ratify hiện trạng), runtime qua pooler, migrate qua `DIRECT_URL`; storage: Deferred nhưng ứng viên mặc định là Supabase Storage", hoặc ngược lại ghi kế hoạch bỏ Supabase và sửa `.env.example`.

### Low

**L1.** AD-1 trỏ tới "AD-19" — không tồn tại; ý là AD-17. Câu cuối AD-1 cũng lặp lại AD-17 → bỏ khỏi AD-1, chỉ giữ tham chiếu.

**L2.** Nhãn `[ADOPTED]` không nhất quán: AD-8, AD-9, AD-10, AD-15 không có nhãn. Agent không biết các AD này là đề xuất hay đã chốt. Thêm nhãn hoặc định nghĩa ý nghĩa nhãn.

**L3.** Kế hoạch di chuyển (AD-17) bỏ sót: `components/json-ld.tsx`, `components/theme-toggle.tsx` (gốc `components/`, AD-11 chỉ cho `ui/` và `shared/`); route CMS hiện có `/cms/new`, `/cms/posts/[id]` → cây mới `cms/bai-viet[/moi|/[id]]` (đổi URL CMS chưa được nói là có chủ đích); route `app/(site)/[category]` → `[danh-muc]`; `app/styleguide` (NFR-10).

**L4.** Stack: có bản vá mới hơn — `next` 16.4.4, `react` 19.3.1, `tailwindcss` 4.3.4 (npm, 2026-11-03). TypeScript 7.0.2 đã ra; giữ 5.9.3 là hợp lý (brownfield) nhưng nên ghi "cố ý giữ 5.x". Prisma 8 mới ở RC, giữ 7.10.1 đúng. Thiếu Node production (chỉ ghi "dev").

**L5.** Danh sách đường dẫn hệ thống cấm cho Danh mục (FR-28: `cms`, `bai-viet`, `bio`, `tim-kiem`, `api`, và cần thêm `meo-vat`, `gom-link`, `styleguide`) chưa có chỗ ở. Ghi: một hằng `RESERVED_SLUGS` trong `modules/categories/constants.ts`, dùng bởi `slugField` khi validate Danh mục.

**L6.** AD-2/AD-5/AD-8 kiểm được bằng máy nhưng spine không yêu cầu: thêm luật ESLint `no-restricted-imports` (cấm `modules/*/service`, `actions`, `schema` từ module khác; cấm `platform/db` trong `app/`) để agent nhỏ nhận lỗi ngay thay vì dựa vào trí nhớ.

**L7.** Style/rationale có thể cắt hoặc chuyển xuống Conventions: AD-12 (route mỏng) đúng là luật nhưng chỉ ảnh hưởng một file, có thể gộp vào Conventions; "Không có `index.ts`" (AD-5) là sở thích nhưng rẻ, giữ được. Không thấy AD nào thuần là rationale. Cột "Prevents" của AD-3 ("tự đặt module mới trùng") đúng là divergence thật — giữ.

## Đánh giá theo từng tiêu chí

| Tiêu chí | Kết quả | Ghi chú |
| --- | --- | --- |
| Chốt đúng các điểm phân nhánh và không bỏ sót | Chưa đạt | Thiếu: vòng đời AI (C1), đọc động trên site tĩnh (H4), 301 (H5), upload (H6), hợp đồng `ask()` (H7) |
| Rule kiểm được và thực sự ngăn divergence | Phần lớn đạt | Lỗi: AD-15 không theo được (H2); AD-9 thiếu đích (H3); AD-6 "mọi tag bị ảnh hưởng" mơ hồ (M2) |
| Deferred không thể làm hai unit lệch nhau | Phần lớn đạt | Lệch được: nhà cung cấp AI khi chưa có hợp đồng (H7), nơi lưu file khi chưa có đường upload (H6), cơ chế rate limit (M3) |
| Tech đã kiểm là hiện hành | Đạt | Đều tồn tại; có bản vá mới hơn (L4) |
| Ratify brownfield hoặc có kế hoạch di chuyển | Một phần | AD-17 tốt, nhưng mâu thuẫn companions (H1), Supabase (M6), Prisma nhiều file (M1), file sót (L3) |
| Phủ năng lực PRD | Một phần | FR có map; NFR chưa đủ (M5); FR-2, FR-11, FR-31, FR-34 vướng ở dữ liệu/quyền ghi (H2, H3) |
| Vận hành (deploy, môi trường, infra) | Chấp nhận có điều kiện | Deferred có lý do (chưa deploy, NFR-10), nhưng phải ratify Supabase và liệt kê phụ thuộc in-memory (M6) |
| Rule đủ cụ thể cho agent nhỏ | Phần lớn đạt | AD-5, AD-6, AD-8, AD-13, AD-14 rất cụ thể; yếu ở AD-15, AD-16, AD-9 |

## Thứ tự sửa khuyến nghị

1. C1 + H7 (một AD mới về lời gọi AI, gồm vòng đời `Suggestion` và hợp đồng `ask()`).
2. H2 + H3 + M1 (ERD, danh sách đích của AD-9, tách Prisma, tên enum Loại bài).
3. H4 + H5 + H6 (AD về đọc động/301/upload trên site tĩnh).
4. H1 + M6 (quan hệ với companions, ratify Supabase).
5. Phần còn lại.
