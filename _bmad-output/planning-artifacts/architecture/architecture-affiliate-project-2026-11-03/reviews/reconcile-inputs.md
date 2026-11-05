# Đối chiếu đầu vào — Architecture Spine affiliate-project

> Ngày: 2026-11-03 · Spine: `ARCHITECTURE-SPINE.md` (status: draft) · Đầu vào: `prd.md` + `addendum.md` (prd-affiliate-project-2026-11-03), `docs/quy-dinh.md`, `docs/kien-truc-codebase.md`, `docs/quy-uoc-code.md`, `docs/no-ky-thuat.md` · Không sửa spine hay tài liệu nào.

Mức độ: **CAO** = story sẽ bị chặn hoặc làm sai nếu spine không nói; **VỪA** = agent phải tự đoán, dễ lệch giữa các story; **THẤP** = ghi chú/đồng bộ.

---

## Phần A — PRD + addendum đối chiếu spine

### A.0 Nhận xét cấu trúc (ảnh hưởng mọi FR)

| # | Mức | Khoảng trống | Đề xuất sửa |
|---|---|---|---|
| A0-1 | CAO | AD-15 cấm thêm bảng/cột ngoài spine (`[SCHEMA-UNKNOWN]` và hỏi), nhưng ERD chỉ có tên thực thể, **không có trường nào**. Hệ quả: gần như mọi story có schema đều bị chặn, hoặc agent tự thêm cột rồi vi phạm AD-15. Nhiều yêu cầu "lặng" của PRD nằm chính ở trường dữ liệu (xem A.1). | Thêm vào Structural Seed một bảng "trường bắt buộc theo PRD" cho từng model (ít nhất các trường mang yêu cầu: `Product.hidden`, `priceUpdatedAt`, cờ bio; `SocialPost.postedAt/postUrl/firstCopiedAt`; `ContentSet.createdAt`; `SlugRedirect`…), hoặc nới AD-15: "cột phục vụ trực tiếp một FR được thêm trong story của FR đó; bảng mới vẫn phải hỏi". |
| A0-2 | VỪA | Frontmatter `binds: [FR-1..FR-38, NFR-1..NFR-11]` nhưng Capability map **không có** NFR-3, NFR-4, NFR-5 (chỉ nhắc trong AD-7), NFR-8, NFR-10, NFR-11; không có dòng nào cho rủi ro R-1..R-8. | Thêm dòng map cho từng NFR còn thiếu (kể cả "UX quyết định" nếu không phải việc kiến trúc) và một bảng nhỏ R-x → AD/FR giảm thiểu. |
| A0-3 | VỪA | Danh sách module đích của AD-9 (`posts`, `content-sets`, `research`, `categories`) **thiếu `products` và `inspirations`**, trong khi: FR-11 gợi ý Danh mục cho *Sản phẩm* (duyệt phải ghi `Product.categoryId`); FR-2 Duyệt/tạo Bộ nội dung từ Cảm hứng phải chuyển Cảm hứng sang *đã dùng* (ghi bảng của `inspirations`). Ngược lại `categories` có trong danh sách nhưng Gợi ý Danh mục không tạo/sửa bảng `Category` mà chỉ gán khoá ngoại. | Sửa danh sách đích AD-9 thành `posts`, `products`, `content-sets`, `research`, `inspirations`; bỏ `categories` (hoặc ghi rõ lý do). Ghi luật: chuyển trạng thái Cảm hứng do `content-sets` gọi `inspirations/service.ts` → đây là ngoại lệ AD-2 thứ hai, phải ghi vào AD-2, hoặc đưa việc tạo Bộ nội dung vào luồng Duyệt của `suggestions`. |

### A.1 Yêu cầu "lặng" bị cấu trúc AD bỏ rơi

| # | Mức | PRD | Spine đang nói gì | Khoảng trống | Đề xuất sửa |
|---|---|---|---|---|---|
| A1-1 | CAO | **NFR-3** mỗi thao tác AI hoàn tất/báo lỗi ≤ 90 s; rời màn hình quay lại vẫn thấy kết quả. Addendum A1: `LLM_TIMEOUT_MS` mặc định 55 s; Claude CLI "chậm vài chục giây". | Không AD nào nói timeout, chạy đồng bộ hay nền, hay lưu trạng thái "đang chạy". Capability map không có NFR-3. | (a) Hiện `app/cms/layout.tsx:11` `maxDuration = 60` < 90 s. (b) FR-12 tạo 4 phần trong "một lần" có thể vượt 90 s nếu gọi tuần tự. (c) "Rời màn hình vẫn thấy kết quả" đòi kết quả ghi DB ngay khi xong (hoặc bản ghi `Suggestion` trạng thái đang chạy), không chỉ nằm trong state client. | Thêm vào AD-10 (hoặc AD mới "Thao tác AI dài"): ngân sách thời gian tổng 90 s, timeout từng lời gọi, `maxDuration` của route CMS ≥ 90; mỗi phần của Bộ nội dung là một lời gọi AI và một `Suggestion` riêng, ghi ngay khi xong (đáp ứng luôn FR-12 "phần lỗi không làm mất phần đã xong"); màn hình đọc lại `Suggestion` từ DB. Nếu chọn chạy nền thì nói rõ cơ chế (một tiến trình VPS). |
| A1-2 | CAO | **FR-27** đổi slug Bài web đã xuất bản → 301; **FR-28** đổi đường dẫn Danh mục → 301. | Không có. ERD không có bảng lịch sử slug; AD-12 chỉ nói `notFound()` khi rỗng. `[NO-07]` vẫn mở. | Thiếu nơi lưu slug cũ, chủ sở hữu, và cách phát 301 trên trang tĩnh (`ensureStatic`). | Thêm model `SlugRedirect` (hoặc `PostSlugHistory` + `CategorySlugHistory`) vào ERD với chủ sở hữu; luật trong AD-12: screen tra slug cũ trước khi `notFound()` và gọi `permanentRedirect()`; query tra redirect có cache + tag. Ghi rõ cần kiểm chứng `permanentRedirect` dưới `ensureStatic = "navigation"`. |
| A1-3 | CAO | **FR-28** đường dẫn Danh mục không trùng đường dẫn hệ thống (`cms`, `bai-viet`, `bio`, `tim-kiem`, `api`…). | Cây thư mục đặt `[danh-muc]` ở gốc `(site)` cạnh `meo-vat`, `gom-link`, `bio`, `tim-kiem`, `bai-viet`; AD-14 có `slugField` nhưng không nói danh sách cấm. | Không có nguồn duy nhất cho danh sách slug dành riêng; dễ quên `meo-vat`, `gom-link`, `styleguide`, `sitemap.xml`, `robots.txt`, `placeholder.svg`. | Thêm vào AD-14 (hoặc `platform/slug`): hằng `RESERVED_SLUGS` một chỗ, `categories/schema.ts` refine bằng nó; luật "thêm route gốc mới trong `(site)` phải thêm vào `RESERVED_SLUGS`". |
| A1-4 | CAO | **FR-12** ghi thời điểm tạo Sản phẩm, tạo Bộ nội dung và **lần copy đầu tiên** (đo SM-3); **FR-20** đánh dấu *đã đăng* + link bài đăng + thời điểm (đo SM-2), và trên Sản phẩm thấy đã lên nền tảng nào. | Map gom FR-12..21 vào `content-sets`; ERD có `SocialPost` nhưng không trường nào. | "Lần copy đầu tiên" là một **thao tác ghi** từ nút copy (client) — chưa có action, chưa biết ghi trên `SocialPost` hay `Suggestion` (FR-22 cho copy cả bản chưa Duyệt, khi đó chưa có `SocialPost` theo AD-9). Đọc "đã lên nền tảng nào" từ `products` sang `content-sets` cần qua `content-sets/queries`/`cms-queries`. | Ghi trong spine: `SocialPost.postedAt`, `postUrl`, `firstCopiedAt` (hoặc `ContentSet.firstCopiedAt`); action `markFirstCopy` idempotent trong `content-sets`; làm rõ copy bản chưa Duyệt ghi mốc vào đâu. |
| A1-5 | CAO | **FR-36** tìm kiếm (query theo từ khoá, không dấu); **FR-29** trang Danh mục có phân trang. | `tim-kiem` nằm trong `(site)`; AD-7 bắt `ensureStatic = "navigation"`, cấm `headers()`/dữ liệu theo request ở trang public, chỉ cho Lượt xem/tim lấy phía client. | Từ khoá tìm kiếm và số trang qua `searchParams` là dữ liệu theo request → mâu thuẫn trực tiếp với AD-7/`[KT-06]`. Spine không chọn cách: tìm phía client qua Server Action đọc? route ngoài `(site)`? phân trang theo đường dẫn `/[danh-muc]/trang/[n]`? Tìm không dấu cần cột chuẩn hoá/`unaccent` (AD-15 chỉ nói "index đặc biệt viết tay"). | Thêm vào AD-7 một ngoại lệ có tên: "đọc theo request công khai" (tìm kiếm) — cách làm, nơi đặt (`posts` action đọc hoặc route riêng), cache, giới hạn tần suất; phân trang Danh mục dùng segment đường dẫn, prerender N trang đầu. Ghi cột/biểu thức tìm không dấu trong ERD. |
| A1-6 | CAO | **FR-34** "Xem nhiều" tính trong 30 ngày. | AD-15: Lượt xem/tim nằm trong `PostStat` (quan hệ 1–0..1 với `Post`). | Một bộ đếm tổng không tính được cửa sổ 30 ngày. | Thêm bảng theo ngày (`PostStatDaily(postId, day, views)`) hoặc ghi rõ PostStat có cả tổng và bucket; luật cache cho khối "Xem nhiều" (cacheLife giờ, không cần `updateTag`). |
| A1-7 | VỪA | **FR-5 / NFR-5 / QD-16** ẩn Sản phẩm biến mất khỏi mọi Bài web và Trang bio trong ~1 phút. | AD-7 nhắc FR-5, luật "query gắn tag của mọi module nó đọc". | (a) Cơ chế dựa vào `updateTag` tái tạo trang đã prerender — điều này **chưa kiểm chứng** (`[NO-23]`). (b) Không có luật "mọi query trả Sản phẩm (kể cả `posts/queries` join `PostProduct`) phải lọc `hidden = false`" — truy vấn của `posts` đọc bảng của `products`. (c) Không nói `cacheLife` tối đa, nên nếu `updateTag` không đủ thì không có lưới an toàn. | Thêm vào AD-7: hàm lọc/select Sản phẩm công khai duy nhất ở `products/queries.ts` (vd. `publicProductWhere`) mà mọi module khác phải dùng; `cacheLife` cho trang có Sản phẩm không dài hơn mức chấp nhận; đưa `[NO-23]` thành điều kiện kiểm chứng trước story FR-5. |
| A1-8 | VỪA | **NFR-7 / FR-33 / FR-35** không dữ liệu định danh; không đếm Người vận hành và bot; một tim mỗi trình duyệt; ≤ 30 tim/phút mỗi nguồn. | AD-6: action công khai không lưu định danh, có giới hạn tần suất (mức để Deferred). | "Mỗi nguồn" thực tế là IP — spine không nói được giữ IP trong bộ nhớ hay băm, bao lâu. "Một tim mỗi trình duyệt" phải lưu phía client (localStorage) — không ghi. "Không đếm Người vận hành": trình duyệt không gửi Basic Auth cho trang `(site)`, nên action không biết đó là Vinh — cần cờ client đặt khi vào CMS. Bot: action phải đọc `user-agent` qua `headers()`. | Bổ sung vào AD-6: IP chỉ dùng trong bộ nhớ (hoặc băm có muối xoay vòng), không ghi DB, không log; chống trùng tim bằng localStorage; cờ "đang là người vận hành" do CMS đặt (localStorage/cookie không định danh); lọc bot theo UA trong action. |
| A1-9 | VỪA | **FR-25 / R-7 / QD-13/14** link Shopee nguyên gốc, không `/go/...`, `rel="sponsored nofollow"` (QD-14: `+ noopener`), tab mới; áp cho thẻ Sản phẩm, Trang bio **và Banner**. | AD-14: chỉ nhận domain Shopee. AD-11: **chỉ** `products/components` render Link affiliate. | (a) Banner (FR-32) có link đích trỏ Shopee nhưng thuộc module `banners` → hoặc vi phạm AD-11, hoặc phải import component của `products` (được AD-2 cho phép nhưng spine không nói). (b) Luật "không chuyển hướng, rel, target" không có trong spine — chỉ có ở QD. (c) `[NO-02]` sanitize ghi đè `rel`. | Thêm câu vào AD-11/AD-14: component `AffiliateLink` duy nhất ở `products/components`, đặt `rel="sponsored nofollow noopener" target="_blank"`, `banners` dùng nó khi link đích là Shopee; cấm route chuyển hướng (`/go`). Ghi R-7 vào map. |
| A1-10 | VỪA | **FR-24 / FR-30 / FR-31 / QD-15** Nhãn công khai trên Trang bio, ở đầu trang, câu chữ sửa được nhưng **không tắt được**. | Map FR-24 → `products/components`; `BioSettings` đứng riêng. | Không nói câu chữ nhãn trên bio lấy từ `BioSettings` và truyền vào component của `products`; không có luật "không rỗng/không tắt" (`requiredText` + fallback mặc định). | Ghi rõ: `bio` truyền text từ `BioSettings.disclosureText` (bắt buộc, có mặc định) vào `AffiliateDisclosure` của `products`; không có cờ bật/tắt. |
| A1-11 | VỪA | **FR-31** chọn Sản phẩm hiện trên Trang bio, ghim, sắp thứ tự; sản phẩm mới mặc định hiện. | `bio` sở hữu `BioSettings` "đứng riêng". | Cờ hiện/ghim/thứ tự của từng Sản phẩm trên bio: nếu nằm trên `Product` thì `bio` CMS ghi bảng của `products` (vi phạm AD-4/AD-2); nếu ở bảng riêng `BioItem` thì ERD thiếu. | Thêm `BioItem(productId, pinned, sortOrder, visible)` do `bio` sở hữu, hoặc ghi cờ trên `Product` và để thao tác ghi đó nằm trong `products/actions.ts`. |
| A1-12 | VỪA | Thuật ngữ §3: **Hồ sơ nghiên cứu** tạo cho một Sản phẩm **hoặc** Cảm hứng (FR-2); FR-9/FR-10 Vinh chọn Người đọc mục tiêu và Góc viết; Gom link gợi ý Góc viết từ nhiều hồ sơ. | ERD chỉ có `Product ||--o{ ResearchProfile`. | Thiếu quan hệ `Inspiration → ResearchProfile`; không rõ nơi lưu Người đọc/Góc viết **đã chọn** (trên `ContentSet`?) và Góc viết cấp bài Gom link (nhiều Sản phẩm). | Thêm `inspirationId` tuỳ chọn cho `ResearchProfile` (CHECK đúng một khoá như `Suggestion`); ghi `ContentSet.audience`, `ContentSet.angle` (snapshot) trong ERD. |
| A1-13 | VỪA | **FR-23** bộ ≥ 20 câu mẫu, bắt ≥ 90 % vi phạm, báo nhầm ≤ 20 %. | AD-16: không gọi AI thật, không e2e. | Tiêu chí FR-23 chỉ đo được với nhà cung cấp thật → không story nào có chỗ chứa bài đo này. | Thêm vào AD-16 một ngoại lệ: "bài đánh giá prompt" (eval) chạy tay với AI thật, đặt ở `modules/suggestions/prompts/*.eval.ts` hoặc script, không chạy trong `vitest` mặc định; kết quả ghi trong `docs/kiem-chung.md`. |
| A1-14 | VỪA | **FR-1** tải video/ảnh ~100 MB/file. | AD-6: mọi ghi CMS là Server Action, cấm Route Handler cho ghi nội bộ; nơi lưu Deferred. | Server Action có giới hạn kích thước body (mặc định ~1 MB); 100 MB qua Server Action không thực tế. Luật AD-6 đang chặn phương án tự nhiên (Route Handler upload/presigned URL). | Ghi ngoại lệ có tên trong AD-6 cho upload file (Route Handler dưới `/cms/...` có `requireAdmin`, hoặc upload trực tiếp lên storage bằng URL ký), quyết định cùng mục Deferred "Nơi lưu ảnh/video". |
| A1-15 | VỪA | **NFR-8** sitemap gồm Danh mục, JSON-LD Article + BreadcrumbList theo Danh mục, canonical, OG, noindex trang tìm kiếm; **NFR-5** Core Web Vitals; Banner theo thời gian hiển thị (FR-32). | NFR-8 không có trong map; `sitemap.ts`, `robots.ts` có trong cây. | (a) Không có luật SEO nào — đặc biệt noindex `/tim-kiem`, breadcrumb theo Danh mục (không còn theo Loại bài). (b) Banner hết hạn theo `endAt` sẽ không tự ẩn nếu trang cache "days" và không có `updateTag` lúc hết hạn. | Thêm dòng map NFR-8 → `app/sitemap.ts`, `robots.ts`, `generateMetadata` các screen, `components/shared/json-ld`; luật cache Banner: `cacheLife` ngắn (≤ giờ) hoặc lọc thời gian phía client. |
| A1-16 | THẤP | **NFR-10** xoá `/styleguide` trước deploy; giữ 10 bài mẫu; seed dùng link `shopee.vn/search` bị FR-3 từ chối (A4); §10 câu hỏi 5: 8 Danh mục khởi tạo. | Deferred chỉ có hạ tầng production. AD-17 nói di chuyển code, không nói di chuyển **dữ liệu**. | Không có luật migrate dữ liệu: `Product` theo bài → kho chung + `PostProduct`; enum `Category` → Loại bài + bảng Danh mục (gán 10 bài mẫu); seed `deleteMany()` (`[NO-08]`). | Thêm vào AD-15/AD-17: migration dữ liệu viết SQL tay trong cùng migration đổi schema; seed idempotent (upsert), không xoá; seed link mẫu được miễn validate hoặc đổi sang domain Shopee hợp lệ. Ghi `/styleguide` vào Deferred "trước deploy". |
| A1-17 | THẤP | **NFR-2** tự chuyển nhà cung cấp, dữ liệu nhập không mất; A1: output JSON không hợp lệ → validate + thử lại. | AD-10: output luôn `parse` Zod. | Không nói khi `parse` lỗi thì thử lại/rơi sang nhà kế tiếp, cũng không nói luật failover thuộc `platform/ai`. | Thêm một câu vào AD-10: `ask()` thử lại/rơi nhà khi JSON sai schema; hết nhà thì ném `UserError` tiếng Việt; dữ liệu nhập đã lưu trước khi gọi AI. |
| A1-18 | THẤP | **FR-22** không xuất bản Bài web khi phần AI chưa Duyệt; Bài MXH chưa Duyệt vẫn copy được (có cảnh báo); **FR-21** tạo lại có chỉ dẫn. | AD-9: AI → `Suggestion`, Duyệt mới ghi đích. | (a) Nếu `Post` chỉ được tạo khi Duyệt thì luật "chặn xuất bản" là thừa — cần nói rõ để agent không làm cả hai. (b) Copy bản chưa Duyệt đọc từ `Suggestion` — ok nhưng nên ghi. (c) Tạo lại: `Suggestion` mới thay thế hay liên kết bản cũ (`supersedesId`)? | Ghi 2–3 câu làm rõ trong AD-9. |

### A.2 Bảng phủ FR/NFR/R (tóm tắt)

| Mục | Phủ bởi | Ghi chú |
|---|---|---|
| FR-1 | map + Deferred storage | upload 100 MB vướng AD-6 (A1-14) |
| FR-2 | map + Deferred video | ERD thiếu Inspiration→ResearchProfile; chuyển trạng thái *đã dùng* vướng AD-2 (A0-3, A1-12) |
| FR-3, FR-4 | AD-4/14/15 | — |
| FR-5 | AD-7 | phụ thuộc `[NO-23]` chưa kiểm chứng; thiếu luật lọc `hidden` chung (A1-7) |
| FR-6..FR-10 | AD-9/10 | nơi lưu Người đọc/Góc viết đã chọn (A1-12) |
| FR-11 | AD-9 | `products` thiếu trong danh sách đích (A0-3) |
| FR-12 | AD-9/10 | mốc thời gian SM-3, phần lỗi độc lập (A1-1, A1-4) |
| FR-13..FR-19 | AD-9/10/14 | — |
| FR-20 | map | trường `postedAt/postUrl` (A1-4) |
| FR-21, FR-22 | AD-9 | làm rõ (A1-18) |
| FR-23 | AD-9 | eval mâu thuẫn AD-16 (A1-13) |
| FR-24, FR-25 | AD-11/14 | Banner, rel, no-redirect, nhãn bio (A1-9, A1-10) |
| FR-26 | AD-7/11/12 | bài liên quan theo **Danh mục** (không còn Loại bài) chưa nói |
| FR-27 | — | **301 thiếu** (A1-2) |
| FR-28 | AD-4/15 | **301 + slug dành riêng thiếu** (A1-2, A1-3) |
| FR-29 | AD-7 | phân trang vs `ensureStatic` (A1-5) |
| FR-30, FR-31 | AD-7/11 | cờ bio thuộc ai (A1-11) |
| FR-32 | AD-7/14 | hết hạn hiển thị vs cache (A1-15) |
| FR-33..FR-35, FR-38 | AD-6/7/15 | 30 ngày, bot, người vận hành (A1-6, A1-8) |
| FR-36 | AD-7/15 | **mâu thuẫn ensureStatic** (A1-5) |
| FR-37 | AD-11 | — |
| NFR-1, 2, 9 | AD-10 | failover/retry (A1-17) |
| NFR-3 | — | **thiếu** (A1-1) |
| NFR-4, NFR-11 | — | thuộc UX; nên ghi "UX" trong map |
| NFR-5 | AD-7 | CWV + ~1 phút (A1-7, A1-15) |
| NFR-6 | AD-6 | ngoại lệ engagement mâu thuẫn QD-20 (B-1) |
| NFR-7 | AD-6 | chi tiết (A1-8) |
| NFR-8 | — | **thiếu** (A1-15) |
| NFR-10 | Deferred (một phần) | styleguide, seed, migrate dữ liệu (A1-16) |
| R-1, R-4 | (FR-18, FR-17) | không ghi trong spine — chấp nhận được |
| R-2 | FR-5 → AD-7 | — |
| R-3, R-6 | vận hành / AD-9 | — |
| R-5 | Deferred AI | điều khoản Claude CLI cần kiểm trước story AI đầu tiên |
| R-7 | — | **không nhắc** (A1-9) |
| R-8 | AD-14 (`priceText` + `priceUpdatedAt`), FR-23 | — |

---

## Phần B — Tài liệu dự án đối chiếu spine

### B.1 Mâu thuẫn và bất biến bị quên

| # | Mức | Tài liệu / mục | Spine | Vấn đề | Đề xuất |
|---|---|---|---|---|---|
| B-1 | CAO | `quy-dinh.md` **[QD-20]** "Mọi Server Action ghi dữ liệu phải gọi `requireAdmin()` (qua `run()` trong `app/cms/actions.ts`)"; checklist "Server Action mới có `requireAdmin()`". QD là **blocker**. | AD-6: action công khai `engagement` **không** `requireAdmin`. | Mâu thuẫn trực tiếp với một quy định blocker; reviewer theo QD sẽ chặn story FR-33/FR-35. | Sửa QD-20 (Vinh duyệt): thêm ngoại lệ duy nhất `modules/engagement/actions.ts` theo AD-6; đổi đường dẫn `run()` sang `platform/auth/run`. Spine nên dẫn chiếu rõ "ngoại lệ QD-20". |
| B-2 | CAO | `kien-truc-codebase.md` **[KT-04]** HTML sanitize **khi ghi và khi render**. `quy-dinh` **[QD-12]** HTML bài luôn qua `sanitizePostHtml`; thân bài không có link/ảnh/giá. `[NO-01]`, `[NO-02]`. | AD-10 chỉ: "HTML (của AI) luôn qua sanitize trước khi lưu". | Spine quên (a) sanitize lúc render, (b) sanitize nội dung Vinh tự viết (không qua AI), (c) cấm `a`/`img` trong thân bài. Hai lỗi `[NO-01/02]` không được gắn vào epic `platform/html`. | Thêm vào AD-14 hoặc AD mới: "Mọi HTML bài (AI hay tay) qua `platform/html` khi ghi trong `service.ts` và khi render; whitelist không có `a`, `img`" — và ghi epic platform phải đóng `[NO-01]`, `[NO-02]`, `[NO-03]`, `[NO-04]`. |
| B-3 | VỪA | **[KT-01]** chỉ một tag `POSTS_TAG`, "không đặt tag khác cho truy vấn bài". | AD-7: mỗi module một tag, query gắn tag của mọi module nó đọc. | Mâu thuẫn có chủ đích (target khác current), nhưng KT-01 sẽ khiến agent đọc docs làm sai. | Cập nhật KT-01 theo AD-7 khi epic platform xong. |
| B-4 | VỪA | `quy-uoc-code.md` **[QU-13]/[QU-14]** "báo lỗi nghiệp vụ bằng `throw new Error("<tiếng Việt>")`; `run()` chuyển `message` thành lỗi hiển thị"; fallback "Có lỗi xảy ra". | AD-13: chỉ `UserError` hiện nguyên văn; mọi lỗi khác "Có lỗi xảy ra, thử lại sau". | Đổi hành vi: code theo QU-13 (ném `Error`) sẽ bị nuốt thành thông báo chung. | Cập nhật QU-13/14 sang `UserError`; ghi chuỗi fallback mới. |
| B-5 | VỪA | **[KT-07]** slug duy nhất qua `uniqueSlug()`/`slugify`, cột `@unique`. | AD-14 `slugField`, cây có `platform/slug`; không nói tính duy nhất, không nói lịch sử slug. | Bất biến bị rút gọn: không còn nói "mọi đường tạo/sửa slug qua một hàm" và áp cho cả slug Danh mục; kết hợp với A1-2/A1-3. | Thêm vào AD-14: `uniqueSlug` ở `platform/slug` dùng cho Bài web và Danh mục; đổi slug ghi lịch sử redirect; kiểm `RESERVED_SLUGS`. |
| B-6 | VỪA | **[KT-08]** Loại bài khai báo một chỗ (`CATEGORIES`); `[QU-23]` màu theo Loại bài; addendum A4 tách Loại bài/Danh mục. | AD-5 `constants.ts` lấy giá trị enum từ Prisma; module `categories` là Danh mục. | Spine không nói Loại bài (enum `MEO_VAT/GOM_LINK`) thuộc module nào và map nhãn/slug/màu ở đâu (`posts/constants.ts`?). Route `meo-vat`, `gom-link` trong cây là trang theo Loại bài nhưng không ghi. | Ghi một dòng: Loại bài = enum trên `Post`, chủ `posts`, `posts/constants.ts` là nguồn duy nhất nhãn/slug/màu (thay KT-08). |
| B-7 | VỪA | `kien-truc-codebase.md` dòng 109: `app/cms/layout.tsx` `maxDuration = 60`; `[KT-09]` lớp AI chỉ gọi từ Server Action. | AD-8/AD-10 không nói `maxDuration`. | 60 s < NFR-3 90 s (xem A1-1). | Gộp vào sửa A1-1. |
| B-8 | VỪA | `quy-dinh.md` **[QD-04]** không thêm thư viện mới khi chưa hỏi. | Stack thêm `react-hook-form`, `@hookform/resolvers`, `server-only`, `vitest`. | Spine ghi "thêm mới" nhưng không ghi Vinh đã đồng ý. | Ghi "đã duyệt theo QD-04 ngày …" vào spine trước khi chuyển `status` khỏi `draft`, hoặc nêu trong câu hỏi cho Vinh. |
| B-9 | THẤP | **[QD-14]** `rel="sponsored nofollow noopener"`. PRD FR-25: `sponsored nofollow`. | Spine không nêu giá trị rel. | Ba nguồn lệch nhẹ; spine nên chốt. | Chốt `sponsored nofollow noopener` trong AD-11 (xem A1-9). |
| B-10 | THẤP | **[QU-19]** log duy nhất trong `run()`. | Spine: log trong `run()` **và** `platform/ai`. | Thay đổi có chủ đích — cần cập nhật QU-19. | Cập nhật docs. |
| B-11 | THẤP | `[QU-21]` `lib/content.ts` (`readingMinutes`, `withHeadingIds` — phải gọi **sau** sanitize); `lib/utils.ts` (`cn`); `components/json-ld.tsx`, `components/theme-toggle.tsx` ở gốc `components/`. | Cây `platform/` không có `content`/`utils`; AD-11 chỉ cho `components/ui` và `components/shared`. | Agent không biết chuyển các file này về đâu (AD-17 bắt chuyển khi chạm). | Thêm vào cây: `platform/html/` chứa `content` (hoặc `posts/`), `cn` ở `platform/` hay giữ `lib/utils` như ngoại lệ shadcn; `json-ld`, `theme-toggle` → `components/shared/`. |
| B-12 | THẤP | `[NO-23]` `updateTag` có tái tạo trang prerender? `[NO-24]` Server Action công khai từ trang `ensureStatic`? — **chưa kiểm chứng**. | AD-6 và AD-7 dựa trên cả hai. | Hai AD [ADOPTED] đứng trên giả định chưa xác minh. | Đưa NO-23/NO-24 thành điều kiện "kiểm trước" của epic platform (hoặc spike), ghi trong Deferred/AD-17. |
| B-13 | THẤP | `[NO-08]` seed xoá sạch; `[NO-12]` excerpt 200 vs 500. | AD-14: `VarChar(n)` = giới hạn schema; không nói giá trị. | PRD FR-13 chốt tóm tắt ≤ 200. | Ghi 200 làm giá trị chuẩn; seed idempotent (A1-16). |
| B-14 | THẤP | Spine dẫn chiếu `[PR-07]` (nằm ở `docs/nen-tang-ky-thuat/prisma-7.md:111`) nhưng `prisma-7.md` mô tả một file `prisma/schema.prisma`. | AD-4: `prisma/schema/<module>.prisma` (multi-file). | Cần đổi `prisma.config.ts` (đường dẫn schema) — spine không ghi; `doi-schema.md` sẽ sai. | Thêm một dòng vào AD-17/epic platform: chuyển Prisma sang multi-file schema, cập nhật `prisma.config.ts`. |

### B.2 Bất biến KT/QD — tình trạng trong spine

| Bất biến | Trong spine | Ghi chú |
|---|---|---|
| KT-01 huỷ cache khi ghi | AD-6, AD-7 (mở rộng nhiều tag) | KT-01 lỗi thời |
| KT-02 mọi action qua `run()` | AD-6, AD-13 | ngoại lệ engagement — sửa QD-20/KT-02 |
| KT-03 host ảnh một nguồn | AD-14 (`platform/images.ts`) | đổi đường dẫn |
| KT-04 sanitize ghi **và render** | AD-10 (chỉ khi lưu, chỉ AI) | **thiếu** (B-2) |
| KT-05 public chỉ đọc qua query cache | AD-7 | — |
| KT-06 route public tĩnh | AD-7 | xung đột tìm kiếm/phân trang (A1-5) |
| KT-07 slug duy nhất | AD-14 một phần | **thiếu** tính duy nhất + lịch sử (B-5) |
| KT-08 Loại bài một chỗ | AD-5 chung chung | **không nói chủ** (B-6) |
| KT-09 AI chỉ phía server | AD-8, AD-10 | — |
| KT-10 nhãn + rel | AD-11 | rel không nêu (B-9) |
| QD-01, QD-05/06 | Conventions (Git, Env) | — |
| QD-02 không sửa `generated/` | không nhắc | thấp; nên thêm vào Conventions |
| QD-07 chỉ migrate DB cục bộ | không nhắc | AD-15/16 nói DB test cục bộ; nên thêm một dòng |
| QD-08 AI chờ duyệt | AD-9 | — |
| QD-09/10 không OpenAI, 0đ | AD-10, Deferred | — |
| QD-11 prompt chống bịa, tiếng Việt | AD-10 (`rules.ts`) | — |
| QD-12 thân bài không link/ảnh/giá | **thiếu** | B-2 |
| QD-13/14 link | AD-14 một phần | A1-9 |
| QD-15 nhãn không tắt | AD-11 một phần | A1-10 |
| QD-16 ẩn ~1 phút | AD-7 | A1-7 |
| QD-17 không cào/không tự đăng | không nhắc | chấp nhận được (ngoài phạm vi) |
| QD-18 không dữ liệu cá nhân, không tracker bên thứ ba | AD-6, Conventions Log | thiếu "không tracker bên thứ ba" — thêm một dòng |
| QD-20/21 | AD-6 | B-1 |

---

## Phần C — Tài liệu sẽ lỗi thời khi spine được thực thi

| Tài liệu | Dòng/mục sẽ sai | Lý do |
|---|---|---|
| `docs/quy-dinh.md` | QD-12 (tên `sanitizePostHtml`), QD-14 (mẫu `components/site/product-card.tsx`), QD-20 (`app/cms/actions.ts`, không ngoại lệ), checklist dòng 66–68 | AD-1/5/6/11; engagement không `requireAdmin` |
| `docs/kien-truc-codebase.md` | Gần như toàn bộ: Tóm tắt (dòng 9–16), sơ đồ tầng (20–71), bảng `lib/` và `app/` (77–114: `app/cms/new`, `app/cms/posts/[id]` → `cms/bai-viet/moi`, `cms/bai-viet/[id]`; `[category]` → `[danh-muc]` + `meo-vat`/`gom-link`), Read/Write/AI path (123–155), Ranh giới cache (164–169: một tag), KT-01/02/03/05/07/08/09 (204–213), checklist (230–239). Mục "Dự kiến" (215–228) được thay bằng spine. | Cấu trúc `app → modules → platform`, nhiều tag, Prisma multi-file, `Suggestion` |
| `docs/quy-uoc-code.md` | QU-01 (components/site, cms), QU-02 (actions một file, `lib/posts.ts`), QU-03 (lib phẳng), QU-06/07 (`@/lib/db`), QU-13/14 (`throw Error` → `UserError`, fallback), QU-18 (env trong `lib/` → `platform/`), QU-19 (log thêm `platform/ai`), QU-20/21/22 (đường dẫn `lib/`), QU-24 (thêm quy ước `*.client.tsx`), form `useState`+`toList` → RHF + `zodResolver`; checklist 189–203 | AD-1/5/8/11/13/14 |
| `docs/no-ky-thuat.md` | Đóng khi epic platform xong: NO-01..NO-06, NO-09, NO-10, NO-11, NO-16..NO-19, NO-22; NO-07 chỉ đóng nếu spine bổ sung 301; NO-23/NO-24 phải kiểm trước | AD-10/13/14/16/17 |
| `docs/nen-tang-ky-thuat/*` (ngoài phạm vi yêu cầu, ghi để biết) | `prisma-7.md` (41 tham chiếu đường dẫn cũ, `[PR-07]` một file schema), `nextjs-16.md` (54), `giao-dien.md` (75), `kiem-tra-va-bao-mat.md` (41), `lop-ai.md` (9; API `callLLM` khác `ask({prompt,input,images})` của AD-10) | Đường dẫn `lib/`, `components/site|cms`, `app/cms/actions.ts` |
| `docs/cong-thuc/*` | `them-server-action.md`, `them-trang-public.md`, `them-man-cms.md`, `doi-schema.md`, `them-tinh-nang-ai.md` | Công thức theo cấu trúc cũ; cần viết lại theo AD-5/AD-12 |
| `docs/kiem-chung.md` | 2 tham chiếu đường dẫn cũ; thêm `vitest` và eval FR-23 | AD-16 |

Khuyến nghị: thêm vào AD-17 một câu "story chuyển file cũ thì cập nhật dòng tương ứng trong `docs/kien-truc-codebase.md` / `docs/quy-uoc-code.md` / `docs/no-ky-thuat.md`", và sửa QD-20 **trước** story engagement đầu tiên.
