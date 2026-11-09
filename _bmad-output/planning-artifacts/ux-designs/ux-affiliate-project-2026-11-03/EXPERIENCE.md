---
name: Mẹo Vặt Cuộc Sống
status: final
created: 2026-11-03
updated: 2026-11-09
sources:
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/.memlog.md
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/reconcile-stitch.md
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/imports/stitch/*.html
  - _bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md
  - _bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ui-design-prompt.md
---

# Mẹo Vặt Cuộc Sống — Experience Spine

## Foundation

- **Hai bề mặt, một ứng dụng Next.js.** Site public (người đọc ẩn danh, mobile-first 360–390px, responsive tới desktop) và CMS `/cms` (một người vận hành là Vinh, ưu tiên điện thoại — NFR-4).
- **UI system:** shadcn trên base-ui (style base-nova, AD-14). Site public dựng theo màn Stitch; CMS dùng shadcn mặc định. `DESIGN.md` là tham chiếu hình ảnh; spine này chỉ ghi hành vi.
- **Mockup:** `imports/stitch/*.html` (7 màn site public). **Spine thắng khi mâu thuẫn với mockup** — gồm cả các phần đã loại ở `DESIGN.md` Do's and Don'ts.
- **Sáng/tối theo hệ thống** (NFR-11), không có nút đổi tay. Chỉ tiếng Việt có dấu. Số và ngày theo vi-VN qua `formatDate`/`formatCount`; thời gian tương đối chỉ tính phía client (AD-27). **Ngày cập nhật giá luôn tuyệt đối:** "cập nhật dd/mm/yyyy" (vd. "cập nhật 12/10/2026") ở mọi nơi — không dùng tương đối (memlog 2026-11-04).
- **Ràng buộc kỹ thuật ảnh hưởng UX:** site tĩnh, không đọc `searchParams` ở server (AD-7) → phân trang là đường dẫn `/trang/n`, không "tải thêm"; Lượt xem, Lượt tim, kết quả tìm kiếm lấy phía client. Đang tải = Skeleton trong `<Suspense>` (AD-12). Đăng nhập CMS là hộp thoại Basic Auth của trình duyệt — không có màn đăng nhập.
- Mọi `[ASSUMPTION]` đã được Vinh duyệt 2026-11-04, không phải câu hỏi mở. Xem §Giả định đã chốt.

## Information Architecture

### Site public

| Bề mặt | Route | Đến từ | Mục đích | FR | Mockup |
|---|---|---|---|---|---|
| Trang chủ | `/` | Tab "Tạp chí", logo | Các khu và link "Xem tất cả": bảng bên dưới; thứ tự khu: Responsive & Platform | FR-32, FR-34 | `imports/stitch/trang-chu-meo-vat-cuoc-song-mobile.html`, `…-desktop.html` |
| Bài viết | `/bai-viet/[slug]` | PostCard, Google, chia sẻ | Đọc, mua qua Sản phẩm trong bài, tim, chia sẻ, PostTags, bài liên quan | FR-24–26, FR-35, FR-37 | `imports/stitch/chi-tiet-bai-viet-tay-o-noi-chien-mobile.html`, `…-desktop.html` |
| Danh mục | `/[danh-muc]`, `/[danh-muc]/trang/[n]` | CategorySheet, nav desktop, Breadcrumb, footer | Mô tả + lưới Bài web + Pagination | FR-29 | — (spine-only) |
| Loại bài | `/meo-vat`, `/meo-vat/trang/[n]`, `/gom-link`, `/gom-link/trang/[n]` | Tab "Mẹo vặt", "Gom link", link Trang chủ | Như trang Danh mục nhưng lọc theo Loại bài (memlog 2026-11-04; spine AD-7) | FR-28 | — (spine-only) |
| Trang bio | `/bio` | Link trên hồ sơ Threads/Facebook, tab "Đồ hay" | Sản phẩm đang hiện, nhóm và lọc theo Danh mục (bố cục bên dưới) | FR-30 | `imports/stitch/trang-bio-danh-muc-dong-do-noi-bat-mobile.html`; trạng thái đã lọc: `imports/stitch/chi-tiet-danh-muc-do-bep-thong-minh-mobile.html` |
| Tìm kiếm | `/tim-kiem` (noindex) | Nút tìm trên SiteHeader, 404 | Tìm Bài web, khớp không dấu | FR-36 | `imports/stitch/trang-tim-kiem-trang-thai-rong-mobile.html` |
| 404 | mọi đường dẫn không có | — | Báo không thấy, SearchBox, gợi ý Xem nhiều | brief §7 | dùng EmptyState của màn tìm kiếm |
| Lỗi | `error.tsx` | — | Báo lỗi, nút thử lại | AD-12 | — |

**Khu Trang chủ** (theo thứ tự mobile) [ASSUMPTION: đích "Xem tất cả" từng khu]:

| Khu | Nội dung | "Xem tất cả" |
|---|---|---|
| Banner | — | — |
| Bài nổi bật | **Bài web đã xuất bản mới nhất** (không có trường featured — memlog) | — |
| Gom link đồ xinh | Dải ProductCard *tile* | `/bio` |
| Xem nhiều | — | không có, vì không có route "mọi bài" |
| Mới cập nhật | Bỏ Bài nổi bật để không trùng | cuối khu hai link: "Mẹo vặt" → `/meo-vat`, "Gom link" → `/gom-link` |
| Mẹo vặt hay | Khối Mẹo vặt | `/meo-vat` |

**Điều hướng mobile (< 1024px): BottomTabBar** (thay drawer trong brief — memlog override). Tab của Stitch (Tạp chí / Mẹo vặt / Nhà bếp / Gom link / Đồ xinh) có "Nhà bếp" là một Danh mục cố định, xung đột với Danh mục do Vinh quản lý (FR-28). Bộ tab chốt (memlog):

| Tab | Icon Lucide | Đích |
|---|---|---|
| Tạp chí | `house` | `/` |
| Mẹo vặt | `lightbulb` | `/meo-vat` |
| Gom link | `tag` | `/gom-link` |
| Danh mục | `layout-grid` | mở CategorySheet (Danh mục theo thứ tự hiển thị) |
| Đồ hay | `shopping-bag` | `/bio` |

- Tìm kiếm nằm trên SiteHeader, không chiếm tab. Tên "Đồ hay" dùng thống nhất cho mọi chỗ trỏ tới `/bio` (Stitch lẫn "Đồ hay"/"Đồ xinh"/"Trang Bio đồ xinh") [ASSUMPTION: theo brief].
- Trang bài viết: ArticleActionBar thay BottomTabBar.
- Desktop (≥ 1024px): SiteHeader có nav ngang: Mẹo vặt, Gom link, các Danh mục theo thứ tự; Danh mục không vừa bề ngang gom vào menu "Thêm" [ASSUMPTION]; nút tìm kiếm; nút "Đồ hay".
- SiteFooter: giới thiệu ngắn, link Danh mục, link `/bio`, câu công khai, ©. Không link trang tĩnh (Q9).

**Bố cục `/bio` (FR-30)** — một cột, ProductCard *row*. **Vinh chốt 2026-11-06: theo màn Stitch [Bio-M]** (thay bố cục FilterChips trước đó), vẫn giữ các loại trừ của PRD: không tick xác minh, không @handle, không icon MXH, không emoji, không ô tìm, không "Bài mới nhất", không bộ sưu tập ảo.

| Thứ tự | Khối | Quy tắc |
|---|---|---|
| 1 | Đầu trang căn giữa | Ảnh đại diện vuông bo góc (tuỳ chọn, sửa ở `/cms/bio`, cùng luật upload ảnh Sản phẩm; không có thì không render), tiêu đề "Đồ hay", giới thiệu từ CMS (FR-31). |
| 2 | AffiliateDisclosure | Luôn hiện, không đóng được, **giữ ở đầu trang** trước mọi Link affiliate (FR-24, FR-30) — không dời xuống cuối như khối minh bạch của Stitch. |
| 3 | Dòng Danh mục | Mỗi Danh mục có Sản phẩm hiện một thẻ dòng: tên, mô tả Danh mục cắt 1 dòng (nếu có), viên "N món" (tính cả món ghim), chevron; món chưa có Danh mục thành dòng "Khác" cuối. Hiện 5 dòng đầu; nhiều hơn 6 thì nút "Xem thêm N danh mục" / "Thu gọn". |
| 4a | Màn mặc định | Nhóm "Nổi bật" (Sản phẩm ghim, theo thứ tự bio), tiêu đề `{typography.headline-sm}` + số món. Không có món ghim → mọi nhóm theo Danh mục như trước (Danh mục theo thứ tự hiển thị, "Khác" cuối, món ghim không lặp). |
| 4b | Chạm một dòng Danh mục | Ẩn dòng Danh mục và nhóm mặc định; hiện link "← Về nổi bật" (không có món ghim: "← Tất cả danh mục"), tên + mô tả + số món, danh sách phẳng (món ghim lên đầu, giữ dấu Ghim). Dòng đang xem nằm trên URL `/bio?danh-muc=<slug>` (dòng "Khác": `_khac`) nên quay lại/tải lại giữ đúng màn; slug không khớp → màn mặc định. |
| 5 | Thẻ "Ghé thăm Website" | Thẻ nền `{colors.primary-container}` gần cuối, link `/` cùng tab — liên kết tuỳ chỉnh duy nhất (thay link chữ "Về trang chủ"). |

### CMS

| Bề mặt | Route | Mục đích | FR |
|---|---|---|---|
| Gốc CMS | `/cms` | Chuyển thẳng tới `/cms/bai-viet` [ASSUMPTION]. Sau này thành dashboard thống kê (chưa thiết kế, Vinh 2026-11-05). | — |
| Bài web | `/cms/bai-viet` | Danh sách, lọc trạng thái, cột Lượt xem/Lượt tim, sắp xếp | FR-27, FR-38 |
| Soạn / sửa Bài web | `/cms/bai-viet/moi`, `/cms/bai-viet/[id]` | PostEditor, SEO, ảnh đại diện, ProductPicker, chấm SEO, xem trước, xuất bản; link "← Bộ nội dung" khi bài thuộc một Bộ nội dung; nút **"Tạo bài mạng xã hội"** (FR-16); `/moi` có khối **"Nhập từ URL"** (ImportFromUrl, FR-39) ở đầu màn bên cạnh form "Tạo bản nháp"; form nhập và `/[id]` có nút **"AI chỉnh sửa"** (AiRewriteDialog, FR-40) | FR-4, FR-13, FR-16, FR-22, FR-27, FR-39, FR-40 |
| Sản phẩm | `/cms/san-pham` | Danh sách, tìm theo tên, ẩn/hiện, đã đăng nền tảng nào | FR-3, FR-5, FR-20 |
| Chi tiết Sản phẩm | `/cms/san-pham/[id]` (cũng là màn tạo mới) | Form, Dữ liệu thô, upload, ResearchProfileCard (chọn Người đọc mục tiêu + Góc viết), CreateContentSetPanel (thêm Sản phẩm cho bài Gom link, nền tảng, "Tạo bộ nội dung"), nơi đang dùng | FR-3, FR-5–FR-12 |
| Bộ nội dung | `/cms/bo-noi-dung/[id]` | SuggestionCard theo nền tảng đã chọn (bố cục bên dưới), duyệt, copy, đánh dấu đã đăng | FR-12–FR-23 |
| Cảm hứng | `/cms/cam-hung`, `/cms/cam-hung/[id]` | Tạo nhanh, lọc mới/đã dùng/bỏ qua; chi tiết: từ khoá Shopee + dàn ý, "Gắn sản phẩm", "Bỏ qua" | FR-1, FR-2 |
| Danh mục | `/cms/danh-muc` | CRUD, thứ tự | FR-28 |
| Banner | `/cms/banner` | CRUD, bật/tắt, lịch, tỉ lệ ảnh | FR-32 |
| Trang bio | `/cms/bio` | Giới thiệu, câu chữ nhãn, BioProductList (chọn / ghim / sắp xếp) | FR-31 |
| Hồ sơ phong cách | `/cms/phong-cach` | Website / Threads / Facebook | FR-18 |
| Styleguide | `/cms/styleguide` (noindex) | Xem token và component; chỉ để phát triển | AD-17 |

**Điều hướng CMS — CmsShell:** thanh trên dính (tên mục hiện tại + nút menu) mở `Sheet` trái liệt kê các mục danh sách theo thứ tự bảng trên (không có Gốc CMS, Soạn Bài web, Chi tiết Sản phẩm, Bộ nội dung — tới các màn này qua link trong màn khác); desktop ≥ 1024px là sidebar cố định [ASSUMPTION: không mockup; theo mẫu shadcn]. Nút "Xem site" mở `/` ở tab mới.

**Màn Bộ nội dung `/cms/bo-noi-dung/[id]`** (cao trào UJ-1, NFR-4). Mobile 360px: một cột xếp chồng (không tab — mọi thẻ hiện trên cùng một màn, FR-12); desktop: cùng cột, rộng tối đa 768px căn giữa [ASSUMPTION].

**Số thẻ:** 1 SuggestionCard cho mỗi nền tảng đã chọn + 1 SuggestionCard Bình luận kèm link cho **mỗi** nền tảng mạng xã hội đã chọn (FR-17, AD-19 khoá `contentSetId + platform`). Đủ 3 nền tảng = **5 thẻ**; chỉ Threads = 2; chỉ Bài web = 1. Bình luận là thẻ riêng (Duyệt riêng, FR-22) nằm ngay dưới bài của nền tảng đó.

| Thứ tự | Vùng | Nội dung và hành vi |
|---|---|---|
| 1 | Đầu màn (không dính) | "Bộ nội dung" + Sản phẩm (ảnh 40px + tên, mỗi cái link về `/cms/san-pham/[id]`), Góc viết + hook, Người đọc mục tiêu, link Cảm hứng nếu có, tiến độ "3/5 đã duyệt". Khi Bài web đã có: link "Mở bài web". |
| 2 | Thanh nhảy (dính dưới thanh CmsShell) | Chip "Bài web · Threads · Facebook" (chỉ nền tảng có trong bộ), mỗi chip có chấm màu StatusBadge; chạm cuộn tới khối. |
| 3 | Khối Bài web | SuggestionCard `WEB_POST`. Đã Duyệt → Post nháp được tạo (AD-19); thẻ chuyển chỉ đọc (tiêu đề + tóm tắt) + nút "Mở bài web" → `/cms/bai-viet/[id]` để sửa tiếp, xuất bản. |
| 4 | Khối Threads | SuggestionCard `THREADS_POST` (chuỗi: mỗi bài một khối, sửa được, bộ đếm ≤ 500 ký tự, CopyButton riêng) → SuggestionCard `LINK_COMMENT` Threads → hàng "Đánh dấu đã đăng" / badge "Đã đăng · dd/mm/yyyy" + link. |
| 5 | Khối Facebook | Như Threads: bài (một `Textarea`, đếm từ, CopyButton) → Bình luận kèm link → Đánh dấu đã đăng. |
| 6 | Nền tảng chưa có trong bộ | Dòng "Thêm Bài Facebook" (hoặc Threads/Bài web) → tạo Gợi ý mới vào cùng bộ [ASSUMPTION]. |

Nút Duyệt / Từ chối / Tạo lại nằm ở chân từng thẻ (không dính, không có "Duyệt tất cả" — mỗi phần duyệt riêng, FR-22).

## Voice and Tone

Giọng thương hiệu nằm ở `DESIGN.md` Brand & Style. Microcopy: gần gũi, xưng "mình"/"bạn" ở site public; ngắn, rõ, trung tính ở CMS.

| Do | Don't |
|---|---|
| "Minh bạch liên kết: Bài viết có link tiếp thị liên kết Shopee. Bạn mua qua link, mình nhận một khoản hoa hồng nhỏ để duy trì trang web, giá bạn trả hoàn toàn không đổi." (Stitch) | "Ưu đãi sốc!", "Mua ngay kẻo hết" |
| "Giá tham khảo ~89.000đ · cập nhật 12/10/2026" | "Chỉ 89.000đ", giá gạch, "cập nhật hôm qua" |
| "Xem trên Shopee" | "Mua ngay", "Chốt đơn" |
| "Chưa tìm thấy mẹo nào phù hợp với từ khoá này rồi..." + gợi ý gõ ngắn hơn (Stitch) | "No results" |
| "Đã sao chép liên kết" | "Copied!" |
| CMS: "Đang viết bài Threads…", "Đã duyệt", "Tạo lại" | "Processing request…" |
| CMS lỗi AI: "Chưa tạo được bài Facebook. Phần khác vẫn giữ nguyên. Bấm Tạo lại." | Lỗi tiếng Anh, mã lỗi, stack trace (AD-13) |
| "Đã lưu" | "Lưu thành công ✓" |
| Lỗi bất ngờ: "Có lỗi xảy ra, thử lại sau" (AD-13) | Lộ chi tiết nội bộ |

Câu công khai trên `/bio` lấy từ CMS (FR-31); câu trên bài là câu mặc định ở trên. Không dùng "đã test", "đã kiểm chứng", "tự mua" — PRD không có dữ liệu chứng minh (R-8, FR-23).

## Component Patterns

Hành vi. Hình ảnh ở `DESIGN.md` Components.

### Site public

| Component | Dùng ở | Quy tắc hành vi |
|---|---|---|
| SiteHeader | mọi trang public | Dính đỉnh. Cuộn xuống quá chiều cao header: ẩn dòng phụ "Tạp chí tổ ấm nhỏ", giữ logo + nút (brief "gọn lại"). Nút tìm → `/tim-kiem` với SearchBox tự focus. |
| BottomTabBar | mobile/tablet, trừ trang bài | Tab khớp route hiện tại (kể cả `/trang/n`) có trạng thái chọn. Trên trang Danh mục: tab "Danh mục" được chọn. Không tự ẩn khi cuộn [ASSUMPTION]. |
| CategorySheet | tab "Danh mục" | Mở từ đáy, liệt kê mọi Danh mục có ≥ 1 Bài web đã xuất bản [ASSUMPTION], theo thứ tự hiển thị. Chạm một dòng → `/[danh-muc]`, đóng Sheet. Vuốt xuống / Esc / chạm nền để đóng. |
| SiteFooter | mọi trang public | Link Danh mục và `/bio` mở cùng tab. Trên mobile có padding đáy bằng chiều cao BottomTabBar/ArticleActionBar để không bị che. |
| Banner | Trang chủ, trên cùng | Chỉ Banner đang bật và trong lịch (FR-32). 0 banner: không render, không chừa chỗ. ≥ 2: dải cuộn ngang snap, chấm vị trí, **không tự chạy** [ASSUMPTION]. Cả Banner là **một** link; CTA pill chỉ là hình. Đích Shopee: link là AffiliateLink (FR-25); đích nội bộ: link thường, cùng tab. Không vỡ ở 360px. |
| PostCard | Trang chủ, Danh mục, Loại bài, liên quan, tìm kiếm, 404 | Cả thẻ là một link tới bài. Hiện: PostTypeBadge, tiêu đề, tóm tắt (featured/grid), ngày · phút đọc. **Không** hiện Lượt xem, Lượt tim, tác giả (Q5). *rank*: danh sách là `<ol>`, số lớn `aria-hidden`. |
| RelatedPosts | cuối Bài viết | Tối đa 3 Bài web cùng Danh mục, mới nhất trước (FR-26); mobile PostCard *row*, desktop *grid*. |
| PostTags | cuối thân Bài viết | Chỉ hiển thị, không link (DESIGN Do's). Bài không có thẻ: ẩn. |
| PostTypeBadge | PostCard, đầu bài | Chỉ hiển thị, không là link. |
| ProductCard | Bài viết (*row*), `/bio` (*row*), dải "Gom link đồ xinh" Trang chủ (*tile*) | **Cả thẻ là một link duy nhất** tới Link affiliate (memlog 2026-11-04): một `<a>` bọc ảnh, tên, giá, ngày và nút "Xem trên Shopee" (nút chỉ là hình, không phải phần tử bấm riêng) — một Link affiliate mỗi thẻ, không link trùng cho trình đọc màn hình. Sản phẩm ẩn không bao giờ hiện (FR-5). |
| AffiliateLink | ProductCard, Banner trỏ Shopee | Component thuộc tính link, nhận `children`: nguyên link Shopee, tab mới, `rel="sponsored nofollow noopener"`, không qua `/go` (FR-25, AD-11). Trong ProductCard và Banner, AffiliateLink bọc cả thẻ; nút Shopee chỉ là phần hiển thị bên trong (vùng bấm = cả thẻ). Không đếm click (§7). |
| AffiliateDisclosure | Bài viết, `/bio`, Trang chủ, footer | Vị trí: bài có ≥ 1 Sản phẩm — ngay dưới dòng meta, trước ảnh đầu bài; `/bio` — đầu trang; Trang chủ — dòng chữ ngắn ngay dưới tiêu đề dải "Gom link đồ xinh" (FR-24) [ASSUMPTION]; footer — dạng chữ. Bài không có Sản phẩm: không render (FR-24). Trên `/bio` luôn hiện, không đóng được (FR-30). |
| TableOfContents | Bài viết | Sinh từ h2 (sau sanitize, AD-22). Mobile: mặc định **mở** [ASSUMPTION: Stitch mở sẵn], chạm tiêu đề để thu. Chạm mục: cuộn mượt tới h2, chừa chiều cao header. Desktop: dính cột phải, highlight mục đang đọc. < 2 h2: ẩn. |
| ArticleBody | Bài viết | Chỉ hiển thị HTML đã sanitize; không link, ảnh, giá trong thân (FR-13, AD-22). `blockquote` = Callout "Mẹo nhỏ". |
| LikeButton | Bài viết (cuối bài + ArticleActionBar; desktop: cột phải) | Chạm: đổi trạng thái ngay (optimistic) + số ±1; chạm lại bỏ tim (FR-35). Trạng thái nhớ theo trình duyệt (localStorage, AD-23). Số tim tải phía client; chưa có số thì giữ chỗ cố định rộng, không nhảy layout. Bị giới hạn tần suất / lỗi: hoàn trạng thái, Toast "Chưa thả tim được, thử lại sau nhé". |
| ShareButtons | Cuối bài, ArticleActionBar, desktop dưới tiêu đề | Mobile có `navigator.share`: nút chia sẻ chính mở chia sẻ gốc. Facebook/Threads: mở trang chia sẻ của nền tảng ở tab mới. Sao chép: ghi URL canonical, Toast "Đã sao chép liên kết" (FR-37). |
| ArticleActionBar | Bài viết mobile | Dính đáy. "Sản phẩm" cuộn tới khối Sản phẩm; bài không có Sản phẩm: ẩn nút này. |
| Breadcrumb | Bài viết, Danh mục | "Trang chủ › {Danh mục}"; mỗi cấp là link trừ cấp cuối. |
| Pagination | Danh mục, Loại bài | Link tĩnh (AD-7): trang 1 = `/[danh-muc]` · `/meo-vat` · `/gom-link`; trang n = `…/trang/n` của chính trang đó; `/…/trang/1` chuyển hướng về trang gốc. Hiện trang đầu, cuối, ±1 quanh trang hiện tại. Chỉ 1 trang: ẩn. |
| FilterChips | Tìm kiếm (chưa gõ) | `/bio` không còn dùng FilterChips (Vinh 2026-11-06: dòng Danh mục, xem Bố cục `/bio`). Tìm kiếm: mỗi Danh mục có Bài web đã xuất bản (không có "Tất cả", không kèm số); chạm → `/[danh-muc]` [ASSUMPTION]. Chip chọn cuộn vào giữa. |
| SearchBox | `/tim-kiem`, 404 | Gõ → tìm sau 300ms ngừng gõ [ASSUMPTION], tối thiểu 2 ký tự. Enter tìm ngay. Nút xoá làm rỗng và focus lại. Khớp không dấu (FR-36). Không ghi log từ khoá (NFR-7). |
| SearchResultItem | `/tim-kiem` | PostCard *row*, từ khớp được highlight. Kèm dòng "Tìm thấy N bài viết cho "…"". Chỉ Bài web, không tab "Shopee" (Q4). |
| EmptyState | tìm kiếm rỗng, 404, Danh mục rỗng, bio rỗng | Một tiêu đề, một câu gợi ý, một nút chính; có thể kèm danh sách gợi ý (Xem nhiều). |
| Skeleton | mọi trang khi đang tải | Cùng kích thước và tỉ lệ với nội dung thật; không hiệu ứng nhấp nháy khi reduced-motion; thay bằng nội dung thật không nhảy layout (NFR-5). |
| Toast | toàn site | Hiện 3 giây, không chặn thao tác, đọc bởi `aria-live="polite"`. |

### CMS

| Component | Dùng ở | Quy tắc hành vi |
|---|---|---|
| CmsShell | mọi màn CMS | Xem IA. Toast (Sonner) hiển thị lỗi `UserError` từ server (AD-14). |
| DataList | các màn danh sách | Mobile: danh sách thẻ, mỗi thẻ là link tới chi tiết; desktop: `Table`. Lọc / tìm / sắp xếp / trang qua `?q`, `?trang` và tham số lọc trên URL (AD-12). Nút tạo mới dính đáy trên mobile [ASSUMPTION]. |
| StatusBadge | danh sách, chi tiết | Bài web: Nháp / Đã xuất bản. Sản phẩm: Hiện / Ẩn. Cảm hứng: Mới / Đã dùng / Bỏ qua. Gợi ý AI: Đang tạo / Chờ duyệt / Đã duyệt / Đã từ chối / Lỗi (`SUPERSEDED` không hiện, chỉ có trong lịch sử). Bài mạng xã hội: Chưa đăng / Đã đăng. Banner: Tắt / Chờ lịch / Hết hạn / Đang hiện. Màu: bảng StatusBadge trong `DESIGN.md`. |
| SuggestionCard | Bộ nội dung, Chi tiết Sản phẩm (hồ sơ, Danh mục gợi ý), Cảm hứng | Xem bên dưới. |
| GeneratingIndicator | SuggestionCard GENERATING | Bọc `generating-poller.client.tsx` (AD-18). Dòng "Đang viết {phần}…" + thanh tiến trình không xác định + thời gian đã chạy. `router.refresh()` mỗi 3 giây, dừng sau 120 giây → coi là Lỗi. Rời màn rồi quay lại vẫn thấy trạng thái thật (NFR-3). |
| RiskWarning | trong SuggestionCard | Danh sách cảnh báo; mỗi mục trích câu bị cảnh báo + lý do. Chạm mục: cuộn và highlight câu đó trong nội dung. Không chặn Duyệt (FR-23). |
| CopyButton | mỗi bài trong chuỗi Threads, Bài Facebook, Bình luận kèm link | Một chạm sao chép (FR-19); nút đổi "Đã sao chép" 2 giây. Gợi ý AI chưa Duyệt: chạm lần đầu mở `AlertDialog` "Nội dung này chưa duyệt. Vẫn sao chép?" (Sao chép / Huỷ) (FR-22). Ghi `firstCopiedAt` lần đầu (AD-21). |
| ResearchProfileCard | Chi tiết Sản phẩm | SuggestionCard `RESEARCH` có thêm AudiencePicker, AnglePicker, dải `skipped`. Chưa có hồ sơ: chỉ nút "Nghiên cứu". Cùng lần nghiên cứu sinh SuggestionCard `PRODUCT_CATEGORY` (Danh mục gợi ý) ngay dưới, Duyệt riêng → ghi Danh mục của Sản phẩm; Vinh vẫn chọn tay Danh mục trên form. |
| AudiencePicker / AnglePicker | trong ResearchProfileCard | Xem bên dưới. |
| CreateContentSetPanel | Chi tiết Sản phẩm, dưới ResearchProfileCard | Xem bên dưới. |
| PlatformToggle | CreateContentSetPanel | Checkbox Bài web / Threads / Facebook, mặc định chọn cả 3; Bình luận kèm link đi theo Threads/Facebook. Bỏ hết → nút Tạo tắt (FR-12). |
| SocialFromPostDialog | Soạn Bài web, nút "Tạo bài mạng xã hội" (FR-16) | Xem bên dưới. |
| MarkPostedDialog | Bài Threads/Facebook trong Bộ nội dung | Nút "Đánh dấu đã đăng" → Dialog có ô link bài đăng (tuỳ chọn, kiểm URL). Lưu → badge "Đã đăng · dd/mm/yyyy" + link mở bài (FR-20). Bỏ đánh dấu được [ASSUMPTION]. |
| RegenerateDialog | mọi SuggestionCard trừ Danh mục gợi ý | Ô chỉ dẫn ngắn (tuỳ chọn) + chip mẫu "ngắn hơn", "vui hơn", "bỏ phần giá" (FR-21). Xác nhận → gợi ý cũ thành SUPERSEDED, thẻ chuyển GENERATING. |
| ProductPicker | Soạn Bài web, CreateContentSetPanel | `Combobox` tìm Sản phẩm theo tên (FR-4), chỉ Sản phẩm đang hiện [ASSUMPTION]; thêm vào danh sách; sắp xếp bằng nút lên/xuống [ASSUMPTION]; gỡ khỏi danh sách không xoá Sản phẩm. |
| BioProductList | `/cms/bio` | Mọi Sản phẩm đang hiện (Sản phẩm ẩn không có, FR-31). `Switch` "Hiện trên bio" (mặc định bật cho Sản phẩm mới, FR-31), nút Ghim, lên/xuống trong nhóm "Đang ghim" và nhóm còn lại. Lưu từng thao tác ngay + Toast "Đã lưu". |
| PostEditor | Soạn Bài web, SuggestionCard Bài web | Soạn thân bài với đúng định dạng site hỗ trợ (DESIGN); dán từ nơi khác → lọc qua `sanitizePostHtml` trước khi lưu (AD-22). RiskWarning highlight câu ngay trong ô soạn. |
| SeoCheckPanel | Soạn Bài web | Nút "Chấm SEO" → kết quả chỉ đọc (điểm + gợi ý), không lưu, không qua Duyệt (FR-13, AD-9). |
| PreviewSheet | Soạn Bài web | "Xem trước" mở Sheet toàn màn render đúng component trang public (AD-11), có nhãn "Bản xem trước" dính đỉnh. |
| InspirationActions | `/cms/cam-hung/[id]` | Xem bên dưới. |
| UploadField | Sản phẩm, Cảm hứng, Bài web, Banner | Chọn file từ máy hoặc dán URL ảnh (host cho phép). Hiện thanh tiến trình, huỷ được; video ≤ 100 MB (AD-24). Sai loại/quá cỡ/host không cho phép: lỗi tại trường. Banner hiện tỉ lệ ảnh khuyến nghị ngay dưới trường. |
| ConfirmDialog | mọi thao tác xoá; chuyển bài về nháp | `AlertDialog`: tiêu đề nêu đối tượng ("Xoá bài '…'?"), hậu quả một câu, nút đỏ "Xoá" + "Huỷ" (focus mặc định vào Huỷ). Ẩn Sản phẩm **không** cần xác nhận (một thao tác, FR-5) — hiện Toast có nút "Hoàn tác" [ASSUMPTION]. |
| UnsavedChangesGuard | mọi form CMS | Form có thay đổi chưa lưu: rời trang (link trong app hoặc đóng tab) → hộp xác nhận "Bạn có thay đổi chưa lưu. Rời trang?" (AD-14). |
| CmsForm | mọi form | Lỗi validate hiện tại trường, phía client, cùng schema server; lỗi server → Toast (AD-14). Nút Lưu tắt + spinner khi đang gửi; dữ liệu đã nhập không mất khi lỗi (NFR-2). |

#### SuggestionCard

- **Dùng ở:** Bộ nội dung, Chi tiết Sản phẩm (hồ sơ, Danh mục gợi ý), Cảm hứng. Một thẻ là một Gợi ý AI.
- **Điều kiện:** chuỗi Threads có bài > 500 ký tự → bộ đếm đỏ, "Duyệt" tắt kèm lý do "Bài 3 vượt 500 ký tự" (FR-14) [ASSUMPTION]. Không thêm/xoá bài trong chuỗi; muốn đổi số bài thì Tạo lại có chỉ dẫn [ASSUMPTION]. Bình luận kèm link: "Duyệt" tắt kèm lý do "Duyệt bài {Threads|Facebook} trước" cho tới khi bài cùng nền tảng đã Duyệt (AD-19). Bài web: Bài web đích đã xuất bản → "Duyệt" tắt kèm lý do "Bài đã xuất bản — sửa tay ở Soạn Bài web" (AD-19). Danh mục gợi ý: không có nút Tạo lại; Tạo lại Hồ sơ nghiên cứu thay cả hồ sơ lẫn Danh mục gợi ý đang chờ (AD-19).
- **Trạng thái:** GENERATING → GeneratingIndicator. PENDING → nội dung sửa được + RiskWarning + **Duyệt**, **Từ chối**, **Tạo lại**. APPROVED → thẻ hiện và sửa **đích** (bài mạng xã hội, Bình luận, Hồ sơ nghiên cứu) bằng form của module chủ đích, không sửa nội dung gợi ý nữa; sửa không đổi trạng thái (FR-22, AD-19); riêng Bài web: sửa tiếp ở Soạn Bài web. REJECTED → thu gọn, nút Tạo lại.
- **Lỗi:** FAILED → lỗi tiếng Việt + Tạo lại; các thẻ khác không bị ảnh hưởng (FR-12).

#### AudiencePicker / AnglePicker

- **Dùng ở:** trong ResearchProfileCard. `RadioGroup` dạng thẻ: 1–3 Người đọc mục tiêu kèm lý do (FR-9), ≥ 3 Góc viết kèm hook (FR-10); chọn đúng một mỗi nhóm. Người đọc: mặc định chọn nhóm đầu; Góc viết: **không** chọn sẵn [ASSUMPTION]. Lựa chọn đang chọn có ô "Sửa lại" (FR-9); bản sửa chỉ đi vào Bộ nội dung sắp tạo (lưu ở `ContentSet`), không sửa hồ sơ [ASSUMPTION]. Bộ nhiều Sản phẩm: liệt kê lựa chọn từ mọi hồ sơ, nhóm theo Sản phẩm [ASSUMPTION — PRD §4.3 "gợi ý từ tất cả hồ sơ"] (follow-up kiến trúc).
- **Điều kiện:** chọn được khi hồ sơ *Chờ duyệt* hoặc *Đã duyệt*.
- **Trạng thái:** lựa chọn là trạng thái trên màn, mất khi rời trang.
- **Lỗi:** —.

#### CreateContentSetPanel

- **Dùng ở:** Chi tiết Sản phẩm, dưới ResearchProfileCard. "Sản phẩm trong bộ": Sản phẩm hiện tại (đầu tiên, dùng cho SM-3) + ProductPicker "Thêm Sản phẩm (bài Gom link)". PlatformToggle. Mở từ Cảm hứng (`?cam-hung=<id>`): dải "Từ Cảm hứng: {ghi chú}" ở đầu khối; Bộ nội dung tạo ra ghi liên kết Cảm hứng (FR-2).
- **Điều kiện:** nút **"Tạo bộ nội dung"** chỉ bật khi đủ: (1) mọi Sản phẩm trong bộ có Hồ sơ nghiên cứu *Đã duyệt* [ASSUMPTION — §4.5 "chưa Duyệt thì không coi là sẵn sàng"], (2) đã chọn một Góc viết và một Người đọc, (3) ≥ 1 nền tảng. Khi tắt, dòng lý do dưới nút nêu điều kiện đầu tiên chưa đạt: "Duyệt Hồ sơ nghiên cứu trước" · "Chọn một Góc viết" · "Chọn ít nhất một nền tảng" · "'{tên}' chưa có hồ sơ đã duyệt" (kèm link).
- **Trạng thái:** hồ sơ GENERATING → nút tắt, "Đang nghiên cứu…".
- **Lỗi:** hồ sơ FAILED / REJECTED → picker ẩn, nút tắt, lý do "Tạo lại Hồ sơ nghiên cứu".

#### SocialFromPostDialog

- **Dùng ở:** Soạn Bài web, nút "Tạo bài mạng xã hội" (FR-16). Dialog chọn Threads / Facebook (mỗi nền tảng kèm Bình luận kèm link). Bài đã thuộc Bộ nội dung → tạo vào bộ đó; chưa thuộc (bài tự viết, bài cũ) → tạo Bộ nội dung mới gắn Bài web và các Sản phẩm của bài, dùng nội dung bài làm nguồn [ASSUMPTION]. Xác nhận → chuyển tới `/cms/bo-noi-dung/[id]`.
- **Điều kiện:** nền tảng đã có trong bộ hiện "Đã có", không chọn được (dùng Tạo lại ở Bộ nội dung). Bài chưa gắn Sản phẩm: nút tắt + lý do "Gắn ít nhất một Sản phẩm để có Link affiliate cho Bình luận" [ASSUMPTION].
- **Trạng thái:** sau khi xác nhận, thẻ mới ở Đang tạo.
- **Lỗi:** —.

#### InspirationActions

- **Dùng ở:** `/cms/cam-hung/[id]`. **"Gắn sản phẩm"** mở Sheet hai lựa chọn: "Tạo Sản phẩm mới" → màn tạo Sản phẩm kèm `?cam-hung=<id>`, hoặc "Chọn Sản phẩm có sẵn" (ProductPicker) → `/cms/san-pham/[id]?cam-hung=<id>`. **"Bỏ qua"** đặt *Bỏ qua* một chạm + Toast "Hoàn tác".
- **Điều kiện:** liên kết chỉ được ghi khi tạo Bộ nội dung (kiến trúc: Cảm hứng *đã dùng* suy ra từ `ContentSet`) [ASSUMPTION].
- **Trạng thái:** Cảm hứng *Bỏ qua* có nút "Đưa lại vào Mới".
- **Lỗi:** —.

## State Patterns

### Site public

| Bề mặt | Trạng thái | Xử lý |
|---|---|---|
| Mọi trang | Đang tải | Skeleton cùng bố cục (ảnh tỉ lệ cố định, dòng chữ giả) trong `<Suspense>` (AD-12). |
| Mọi trang | Lỗi | `error.tsx`: EmptyState "Trang đang trục trặc một chút" + nút "Thử lại" + link Trang chủ. |
| Mọi trang | Ngoại tuyến | Không xử lý riêng; trình duyệt tự báo [ASSUMPTION]. |
| ProductCard, PostCard, Banner | Ảnh ngoài lỗi tải / bị gỡ | ImageFallback (DESIGN): khung cùng tỉ lệ + icon, `alt` giữ nguyên; thẻ vẫn bấm được. |
| Trang chủ | 0 Banner | Bỏ khối Banner, Bài nổi bật lên đầu. |
| Trang chủ | Xem nhiều chưa đủ 5 bài / chưa có lượt xem | Hiện số bài có; 0 bài thì ẩn khu. |
| Trang chủ | Khối Loại bài / dải Gom link đồ xinh rỗng | Ẩn khối. |
| Bài viết | Không có Sản phẩm | Ẩn AffiliateDisclosure, khối Sản phẩm, nút "Sản phẩm" trên ArticleActionBar (FR-24). |
| Bài viết | 1 vs nhiều Sản phẩm | Danh sách dọc ProductCard; > 5 Sản phẩm vẫn hiện hết, không thu gọn [ASSUMPTION]. |
| Bài viết | < 3 bài liên quan cùng Danh mục | Hiện số có; 0 bài thì ẩn khu (FR-26). |
| Bài viết | Lượt tim chưa tải / lỗi | Giữ chỗ cố định, hiện "—"; LikeButton vẫn bấm được. |
| Bài viết | Slug cũ | Chuyển hướng vĩnh viễn sang slug mới (AD-20), người đọc không thấy gì khác. |
| Bài viết | Sao chép link thất bại (clipboard bị chặn) | Toast "Chưa sao chép được, bạn giữ ngón tay lên thanh địa chỉ để chép nhé". |
| Bài viết | Người dùng huỷ `navigator.share` | Không làm gì, không Toast. |
| Danh mục / Loại bài | Rỗng | EmptyState "Danh mục này chưa có bài nào" + link Trang chủ. |
| Danh mục / Loại bài | Trang n vượt quá | 404. |
| `/bio` | Không có Sản phẩm hiện | Vẫn hiện đầu trang + AffiliateDisclosure + thẻ "Ghé thăm Website"; EmptyState "Sắp có đồ hay, ghé lại sau nhé". |
| `/bio` | `?danh-muc=` không khớp / Danh mục hết món | Hiện màn mặc định (dòng Danh mục chỉ có Danh mục có món). |
| Tìm kiếm | Chưa gõ | SearchBox + chip Danh mục để duyệt nhanh (thay "Gợi ý từ khoá" của Stitch) [ASSUMPTION]. |
| Tìm kiếm | Mới gõ 1 ký tự | Chưa tìm; giữ nguyên trạng thái trước đó, không báo lỗi. |
| Tìm kiếm | Đang tìm | 3 Skeleton dòng dưới ô tìm; giữ kết quả cũ mờ đi nếu đã có. |
| Tìm kiếm | Không kết quả | EmptyState (Stitch) + "Chủ đề được đọc nhiều nhất" (Xem nhiều). |
| Tìm kiếm | Lỗi | "Chưa tìm được lúc này, thử lại nhé" + nút Thử lại. |
| 404 | — | EmptyState "Trang này không còn ở đây" + SearchBox + 3 bài Xem nhiều. |

### CMS

| Bề mặt | Trạng thái | Xử lý |
|---|---|---|
| Mọi màn | Đang tải | Skeleton của shadcn trong `<Suspense>`. |
| Mọi màn | Không tìm thấy bản ghi | `notFound()` → "Không tìm thấy. Có thể đã bị xoá." + link về danh sách. |
| Danh sách | Rỗng | Một câu + nút tạo ("Chưa có Sản phẩm nào. Tạo Sản phẩm đầu tiên."). |
| Danh sách | Lọc không ra | "Không có kết quả với bộ lọc này" + nút Xoá bộ lọc. |
| Gợi ý AI | GENERATING / PENDING / APPROVED / REJECTED / FAILED | Xem SuggestionCard. |
| Chi tiết Sản phẩm | Hồ sơ chưa Duyệt / lỗi / thiếu Góc viết | Xem CreateContentSetPanel (nút Tạo tắt + lý do). |
| Hồ sơ nghiên cứu | AI bỏ qua ảnh hoặc tìm web (`skipped`) | Dải thông báo đầu thân thẻ: "AI chưa đọc được ảnh — hồ sơ chỉ dựa trên dữ liệu chữ" / "AI không tìm thêm được nguồn trên web". Vẫn Duyệt và tạo Bộ nội dung được (UJ-1 lỗi, FR-6, FR-7). |
| Cảm hứng | Không đọc được video | Thông báo rõ trong chi tiết, gợi ý tải file video lên (FR-2). |
| Soạn Bài web | Bài web có gợi ý AI Đang tạo / Chờ duyệt (sau Tạo lại ở Bộ nội dung) | Nút "Xuất bản" tắt + dòng lý do "Cần duyệt bài AI trước khi xuất bản" + link về Bộ nội dung (FR-22). Khoá chỉ ở giao diện; server không chặn (AD-19). |
| Tạo Bài web — Nhập từ URL | Đang đọc / thành công / lỗi | Ô URL + dòng nhắc "Nội dung lấy từ trang khác — hãy viết lại trước khi xuất bản". Nút "Lấy nội dung" → "Đang đọc trang…" (có thể tới 90 giây). Thành công: màn chuyển sang form bài đầy đủ (Loại bài, Danh mục, tiêu đề, tóm tắt, PostEditor, ảnh đại diện, thẻ, SEO) đã điền sẵn, chưa lưu; có "AI chỉnh sửa" và khối "Ảnh trong bài gốc" (link + nút copy) cạnh ô ảnh đại diện; nút dính đáy "Lưu nháp" tạo bài rồi chuyển sang `/cms/bai-viet/[id]`; UnsavedChangesGuard bật ngay khi form được điền. Lấy lại từ URL khác khi form đã có nội dung → ConfirmDialog. Lỗi: thông báo dưới ô URL, giữ URL; form "Tạo bản nháp" thường vẫn dùng được (FR-39, R-9). |
| Soạn Bài web — AI chỉnh sửa | Đang viết / thành công / lỗi | AiRewriteDialog: ô chỉ dẫn tuỳ chọn, nút "Viết lại" → "AI đang viết…". Thành công: điền form, chưa lưu; Toast "Đã viết lại — chưa lưu" kèm "Hoàn tác"; Cảnh báo rủi ro qua RiskWarningList. Lỗi: Toast tiếng Việt, form không đổi (FR-40). |
| Sản phẩm | Đang ẩn | StatusBadge "Ẩn" + danh sách Bài web và Bộ nội dung đang dùng, mỗi mục là link (FR-5). |
| Sản phẩm | Link affiliate sai domain | Lỗi tại trường: "Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)". |
| Danh mục | Xoá khi còn bài/sản phẩm | Toast lỗi nêu số Bài web và Sản phẩm còn lại; gợi ý chuyển Danh mục trước (FR-28). |
| Danh mục | Slug trùng đường dẫn hệ thống | Lỗi tại trường "Đường dẫn này đã dành cho hệ thống". |
| Banner | Tắt / chưa tới lịch / hết lịch | StatusBadge "Tắt", "Chờ lịch", "Hết hạn" [ASSUMPTION: nhãn]; chỉ "Đang hiện" mới lên site (FR-32). |
| Hồ sơ phong cách | Giá trị vượt giới hạn cứng | Lỗi tại trường nêu giới hạn (AD-25); lưu xong áp cho lần tạo sau, Toast "Đã lưu — áp dụng cho nội dung tạo từ giờ" (FR-18). |
| Trang bio (CMS) | Sản phẩm đang ẩn | Không có trong BioProductList (FR-31). |
| Upload | Đang tải / lỗi | Thanh tiến trình; lỗi giữ nguyên các trường khác. |
| Mọi form | Lỗi AI / server | Toast tiếng Việt; dữ liệu đã nhập giữ nguyên (NFR-2). |
| Mọi form | Mất mạng hoặc Basic Auth hỏi lại khi đang gửi | Giữ nguyên dữ liệu form; Toast "Chưa gửi được, kiểm tra mạng rồi thử lại"; nút Lưu bật lại. |

## Interaction Primitives

- **Chạm / bấm để hành động.** Mọi vùng bấm ≥ 44px (`{spacing.touch-target}`); chip và nút Shopee giữ hình 36px nhưng vùng bấm 44px (DESIGN Layout & Spacing).
- **Cuộn ngang có chủ đích** chỉ ở: dải Banner, dải Gom link đồ xinh trên Trang chủ, FilterChips, thanh nhảy Bộ nội dung. Snap theo thẻ, không thanh cuộn. Trang không bao giờ cuộn ngang.
- **Cuộn mượt** tới neo (mục lục, "Sản phẩm", thanh nhảy Bộ nội dung, mục RiskWarning); tắt khi `prefers-reduced-motion`.
- **Hover (desktop):** ảnh PostCard phóng 3–5%, tiêu đề đổi màu `{colors.primary}`; không có hành động chỉ xuất hiện khi hover.
- **Tim:** hiệu ứng nảy nhẹ ≤ 200ms; tắt khi reduced-motion.
- **Sheet / Dialog:** chồng tối đa một lớp; Esc, chạm nền, vuốt xuống (Sheet) để đóng.
- **CMS:** không kéo-thả; sắp thứ tự bằng nút lên/xuống [ASSUMPTION]. Không phím tắt riêng.
- **Cấm:** cuộn vô hạn / "Xem thêm" tải tiếp (AD-7), carousel tự chạy, popup chào mừng, đếm ngược, nhấp nháy, nút đổi theme tay, hành động ẩn sau long-press.

## Accessibility Floor

Tương phản màu ở `DESIGN.md` Colors. PRD không có NFR a11y riêng; mức sàn dưới đây theo brief §Nguyên tắc 6 [ASSUMPTION: mục tiêu WCAG 2.2 AA].

- `lang="vi"`. Mỗi trang có một `h1`; h2 thân bài theo thứ tự.
- Có link "Bỏ qua tới nội dung" đầu trang.
- Mọi nút chỉ có icon có `aria-label` tiếng Việt ("Thả tim bài viết", "Chia sẻ lên Threads", "Sao chép link", "Tìm kiếm").
- LikeButton là `aria-pressed`; số tim nằm trong nhãn ("Đã thả tim, 342 lượt").
- **ProductCard là một `<a>` duy nhất** (AffiliateLink): không có phần tử bấm lồng bên trong; tên truy cập đọc theo thứ tự tên → giá → "Xem trên Shopee" + nhãn ẩn "mở Shopee trong tab mới"; ảnh Sản phẩm trong thẻ `alt=""` (tên đã có trong link), dấu Ghim có chữ ẩn "Nổi bật". Banner trỏ Shopee theo cùng quy tắc.
- PostCard *rank*: thứ tự do `<ol>` mang; số `01`–`05` `aria-hidden` (ngoại lệ tương phản, DESIGN Colors).
- BottomTabBar là `nav` có `aria-label="Điều hướng chính"`; tab hiện tại `aria-current="page"`.
- Toast, kết quả tìm kiếm ("Tìm thấy N bài viết"), GeneratingIndicator, bộ đếm ký tự Threads khi vượt giới hạn → `aria-live="polite"`.
- AudiencePicker / AnglePicker là `radiogroup` có nhãn nhóm; nút "Tạo bộ nội dung" khi tắt dùng `aria-disabled` + `aria-describedby` trỏ dòng lý do (không `disabled` cứng, để đọc được lý do).
- Sheet/Dialog: bẫy focus, Esc đóng, trả focus về nút mở.
- Focus luôn thấy được: mọi nút có vòng focus 2px `{colors.primary}` cách 2px, chỉ hiện khi dùng bàn phím (`:focus-visible`). Thứ tự Tab theo thứ tự đọc. Thanh dính không che phần tử đang focus (`scroll-padding`).
- Tôn trọng `prefers-reduced-motion` cho cuộn mượt, hover phóng ảnh, hiệu ứng tim, Banner, icon "Đang tạo".
- Ảnh có `alt` (ảnh Sản phẩm ngoài ProductCard = tên Sản phẩm; ảnh đại diện = tiêu đề bài nếu CMS không nhập alt) [ASSUMPTION].
- Zoom 200% không vỡ bố cục; không chặn zoom (Stitch dùng `user-scalable=no` — bỏ).

## Responsive & Platform

Đây là **nguồn duy nhất cho thứ tự các khu Trang chủ**.

| Khoảng | Hành vi |
|---|---|
| < 768px | Một cột. BottomTabBar. TOC thu gọn được ở đầu bài. ArticleActionBar. Trang chủ: Banner → Bài nổi bật → Gom link đồ xinh (ProductCard *tile* cuộn ngang) → Xem nhiều → Mới cập nhật → Mẹo vặt hay (dạng dòng). |
| 768–1023px | Lưới 6 cột: PostCard grid 2 cột. Vẫn BottomTabBar [ASSUMPTION]. |
| ≥ 1024px | Nav ngang, không BottomTabBar. Trang chủ cùng thứ tự, trừ Bài nổi bật (7 cột) + Xem nhiều (5 cột) đứng cạnh nhau (Stitch desktop) rồi tới Gom link đồ xinh lưới 4 cột *tile*; Mới cập nhật 3 cột. Bài viết: đầu bài (Breadcrumb, badge, H1, meta, AffiliateDisclosure, ảnh đầu bài) rộng hết khung như Stitch desktop; từ thân bài chia 8 cột + cột phải dính (TOC, tim, chia sẻ) (Vinh 2026-11-06). |
| `/bio` | Thiết kế cho mobile (FR-30); desktop chỉ căn giữa cột rộng tối đa 560px [ASSUMPTION]. |
| CMS | Mọi luồng UJ-1, UJ-2 làm trọn trên điện thoại 360px (NFR-4). Desktop thêm sidebar và bảng; Bộ nội dung giữ một cột ≤ 768px. |

Stitch chưa có bản desktop/tablet cho Danh mục, Bio, Tìm kiếm, và chưa có dark mode cho màn nào — dựng theo bảng trên và token `-dark`.

## Inspiration & Anti-patterns

- **Giữ từ Stitch:** bố cục tạp chí (Bài nổi bật + bảng xếp hạng số lớn), ProductCard có giá màu đất nung, AffiliateDisclosure dạng hộp ấm, ArticleActionBar mobile, EmptyState minh hoạ tách trà.
- **Loại khỏi Stitch:** danh sách chuẩn duy nhất ở `DESIGN.md` Do's and Don'ts (lý do: `reconcile-stitch.md` §3a).
- **Từ chối — thương mại hung hăng:** đếm ngược, "SALE SỐC", popup — làm mất cảm giác "lời khuyên người quen" (brief §Nguyên tắc 4).

## Key Flows

### UJ-1 — Vinh biến một món đồ trên Shopee thành bộ nội dung 3 nền tảng

*Buổi tối, Vinh có một giờ, CMS trên điện thoại (Basic Auth đã nhập).*

1. Vinh mở `/cms/san-pham`, chạm "Tạo Sản phẩm". Dán tên, Link affiliate, giá tham khảo, thêm ảnh (UploadField), dán mô tả và đánh giá vào Dữ liệu thô. Lưu → ở lại `/cms/san-pham/[id]`.
2. Chạm **"Nghiên cứu"**. ResearchProfileCard hiện GeneratingIndicator "Đang nghiên cứu…". Vinh khoá máy; mở lại vẫn thấy tiến trình (NFR-3).
3. Hồ sơ thành *Chờ duyệt*: thông tin kèm link nguồn, mô tả ảnh, tóm tắt khen/chê/phù hợp, thẻ Danh mục gợi ý ngay dưới (Duyệt riêng). Trong AudiencePicker, nhóm đầu đã được chọn; Vinh giữ nguyên. Trong AnglePicker, Vinh chạm một Góc viết. Nút "Tạo bộ nội dung" vẫn tắt, dòng lý do "Duyệt Hồ sơ nghiên cứu trước" → Vinh Duyệt hồ sơ, nút bật.
4. PlatformToggle giữ cả 3 nền tảng. Chạm **"Tạo bộ nội dung"** → chuyển tới `/cms/bo-noi-dung/[id]`, **5** SuggestionCard (Bài web; Bài Threads + Bình luận; Bài Facebook + Bình luận) cùng ở Đang tạo.
5. **Cao trào:** từng thẻ lần lượt hiện nội dung trên cùng một màn. Thẻ Bài web có RiskWarning "câu 'diệt 99% vi khuẩn' chưa có căn cứ". Vinh chạm cảnh báo, câu được highlight; sửa câu đó, Duyệt. Thẻ chuyển chỉ đọc với nút "Mở bài web" → Soạn Bài web, chạm Xuất bản, rồi chạm link "← Bộ nội dung" để quay lại. Chạm chip "Threads" trên thanh nhảy, CopyButton từng bài trong chuỗi và Bình luận kèm link — mỗi lần một chạm.
6. Sau khi đăng, Vinh chạm "Đánh dấu đã đăng" cho Threads và Facebook, dán link bài. Sản phẩm tự có trên `/bio`; `/cms/san-pham` hiện nó đã lên Threads và Facebook.

Lỗi: (a) AI không tìm thêm được nguồn → dải thông báo trong Hồ sơ nghiên cứu, Vinh vẫn Duyệt và tạo Bộ nội dung từ dữ liệu đã nạp. (b) Bài Facebook FAILED → thẻ đó báo lỗi tiếng Việt + Tạo lại; 4 thẻ kia giữ nguyên. (c) Vinh sao chép bài Threads trước khi Duyệt → AlertDialog cảnh báo, vẫn sao chép được. (d) Hồ sơ FAILED → picker ẩn, nút Tạo tắt với lý do "Tạo lại Hồ sơ nghiên cứu".

### UJ-2 — Vinh đi từ một video mẹo trên TikTok đến sản phẩm

*Ban ngày, Vinh thấy video "mẹo gấp quần áo bằng khay nhựa" nhưng chưa có thời gian làm bài.*

1. Ban ngày, Vinh mở `/cms/cam-hung`, chạm "Lưu cảm hứng": dán link video, thêm một dòng ghi chú, Lưu — dưới 3 lần chạm sau khi dán.
2. Buổi tối, lọc *Mới*, mở Cảm hứng, chạm "Nghiên cứu". AI trả từ khoá tìm trên Shopee và dàn ý bài mẹo (Gợi ý AI, chờ duyệt). Cảm hứng không dùng được → chạm "Bỏ qua".
3. Vinh chép từ khoá, tìm trên Shopee, tạo Link affiliate, rồi chạm "Gắn sản phẩm" → "Tạo Sản phẩm mới" (form như UJ-1) hoặc "Chọn Sản phẩm có sẵn". Chi tiết Sản phẩm mở với dải "Từ Cảm hứng: …"; Vinh làm tiếp bước 2–4 của UJ-1.
4. **Cao trào:** sau khi tạo Bộ nội dung, Cảm hứng tự chuyển *Đã dùng* và hiện link tới Bộ nội dung đó.

Lỗi: không đọc được nội dung video → thông báo rõ, gợi ý tải file video lên; AI vẫn làm việc với tiêu đề và ghi chú.

### UJ-3 — Người đọc từ Threads mua hàng

*Một người lướt Threads lúc nghỉ trưa (PRD chưa đặt tên — chân dung sẽ viết lại khi có dữ liệu).*

1. Đọc hết chuỗi của Vinh, mở bình luận, chạm Link affiliate → Shopee mở thẳng (không qua website).
2. Hôm sau, chạm link trên hồ sơ của Vinh → `/bio`. Thấy ngay giới thiệu ngắn và AffiliateDisclosure ở đầu trang; nhóm "Nổi bật" ở trên cùng.
3. Chạm chip "Nhà bếp" → danh sách lọc tức thì.
4. **Cao trào:** chạm một ProductCard có "Giá tham khảo · cập nhật 12/10/2026" → Shopee mở ở tab mới, `/bio` vẫn còn ở tab cũ.

Lỗi: Sản phẩm đã bị ẩn → không còn trên `/bio` trong khoảng 1 phút (NFR-5); không có trạng thái lỗi hiển thị.

### UJ-4 — Người đọc từ Google khám phá website

*Một người tìm "mẹo tẩy ố nồi chiên không dầu" trên Google.*

1. Vào `/bai-viet/[slug]`; Skeleton chỉ thoáng qua, nội dung không nhảy. Thấy Breadcrumb, tiêu đề, ngày · phút đọc, AffiliateDisclosure ngay trên ảnh đầu bài.
2. Chạm "Mẹo 2" trong mục lục (mobile mở sẵn) → cuộn tới đúng mục.
3. Chạm tim trên ArticleActionBar → tim đặc, số tăng 1.
4. Chạm một bài liên quan cùng Danh mục; từ đó chạm nút tìm, gõ "noi chien" → ra bài "nồi chiên".
5. **Cao trào:** quay về bài đầu, chạm "Sản phẩm" trên ArticleActionBar, đọc giá tham khảo có ngày cập nhật cạnh nhãn minh bạch, chạm ProductCard — mua vì trang không giấu việc mình nhận hoa hồng.

Lỗi: tìm không ra → EmptyState + Xem nhiều; tim bị giới hạn → hoàn trạng thái + Toast.

### Flow 5 — Vinh ẩn một Sản phẩm vi phạm (FR-5, R-2)

*—*

1. Vinh mở `/cms/san-pham`, tìm theo tên, mở Sản phẩm.
2. Chạm "Ẩn" một lần → StatusBadge thành "Ẩn", Toast có "Hoàn tác".
3. **Cao trào:** màn hiện danh sách Bài web và Bộ nội dung đang dùng Sản phẩm này, mỗi mục là link — Vinh biết chính xác bài Threads/Facebook nào cần tự gỡ. Website và `/bio` không còn Sản phẩm trong khoảng 1 phút.

Lỗi: không có.

### Flow 6 — Bài Gom link nhiều Sản phẩm (PRD §4.3, FR-4, FR-12)

*—*

1. Mỗi Sản phẩm đã có Hồ sơ nghiên cứu *Đã duyệt* (UJ-1 bước 1–3).
2. Vinh mở Sản phẩm đầu tiên; trong CreateContentSetPanel chạm "Thêm Sản phẩm (bài Gom link)", tìm và thêm 2 món, sắp thứ tự.
3. AnglePicker hiện Góc viết từ cả 3 hồ sơ, nhóm theo Sản phẩm; Vinh chọn một.
4. **Cao trào:** "Tạo bộ nội dung" → Bộ nội dung có 3 Sản phẩm; Bình luận kèm link chứa Link affiliate của cả 3 (FR-17).

Lỗi: món chưa có hồ sơ đã duyệt → cảnh báo kèm link, nút Tạo tắt.

### Flow 7 — Từ Bài web có sẵn tạo bài mạng xã hội (FR-16)

*—*

1. Vinh mở một Bài web đã xuất bản ở `/cms/bai-viet/[id]`, chạm "Tạo bài mạng xã hội".
2. SocialFromPostDialog: chọn Threads, Xác nhận.
3. **Cao trào:** chuyển tới `/cms/bo-noi-dung/[id]` của bài đó; Bài Threads + Bình luận kèm link ở Đang tạo, Bài web hiện sẵn ở trạng thái đã có.

Lỗi: bài chưa gắn Sản phẩm → nút trong Dialog tắt, lý do "Gắn ít nhất một Sản phẩm để có Link affiliate cho Bình luận".

## Giả định đã chốt (Vinh duyệt 2026-11-04)

Câu hỏi 1–3 của `reconcile-stitch.md` đã chốt trong memlog. Câu 4–10 và mọi giả định dưới đây **đã được Vinh chấp nhận** (memlog 2026-11-04). Nhãn `[ASSUMPTION]` trong file được **giữ để truy vết**, không phải câu hỏi mở — không mở lại khi làm story.

1. **Q4 — Phạm vi tìm kiếm:** chỉ Bài web (FR-36); bỏ tab "Shopee"; `/bio` không có ô tìm, chỉ duyệt theo Danh mục (FR-30; từ 2026-11-06 là dòng Danh mục thay FilterChips).
2. **Q5 — Số đếm công khai:** không hiện Lượt xem ở đâu trên site; Lượt tim chỉ hiện trong trang bài (LikeButton), không trên PostCard.
3. **Q6 — Bộ tab mobile:** Tạp chí / Mẹo vặt / Gom link / Danh mục (Sheet) / Đồ hay.
4. **Q7 — Mô tả ngắn trên ProductCard:** không có; thẻ chỉ ảnh, tên, giá tham khảo + ngày, nút (Product không có trường này, FR-3).
5. **Q8 — Khối Gom link trang chủ:** dải thẻ Sản phẩm như Stitch, nguồn là Sản phẩm đang hiện trên Trang bio theo thứ tự ghim/sắp xếp (FR-31), tối đa 8 thẻ; "Xem tất cả" → `/bio`; rỗng thì ẩn. Bài Gom link tới được qua tab "Gom link" và khu Mới cập nhật.
6. **Q9 — Footer trang tĩnh:** không có.
7. **Q10 — Bộ sưu tập ảo và emoji Danh mục trên bio:** không có; chỉ Danh mục + ghim; có đếm số món.
8. **Khác (đợt 1):** xem bảng "Khác (đợt 1)" bên dưới.
9. **Quyết định 2026-11-04 sau review:** Bài nổi bật = Bài web xuất bản mới nhất; ngày giá tuyệt đối "cập nhật dd/mm/yyyy"; phân trang `/meo-vat/trang/[n]`, `/gom-link/trang/[n]` (spine AD-7); ProductCard là một link duy nhất.

**Khác (đợt 1):**

| Giả định | Vị trí trong spine |
|---|---|
| Tên "Đồ hay" cho mọi lối vào `/bio` | Information Architecture › Điều hướng mobile |
| Nav desktop gom Danh mục dư vào "Thêm" | Information Architecture › Điều hướng mobile (dòng Desktop) |
| CategorySheet chỉ liệt kê Danh mục có bài | Component Patterns › CategorySheet |
| Banner nhiều cái không tự chạy | Component Patterns › Banner |
| Ảnh PostCard 16:9 | `DESIGN.md` › Layout & Spacing |
| Link "Xem tất cả" ở Trang chủ sang `/meo-vat`, `/gom-link` | Information Architecture › Khu Trang chủ |
| TOC mobile mặc định mở | Component Patterns › TableOfContents |
| ProductCard bấm cả thẻ | Component Patterns › ProductCard; Accessibility Floor |
| Ẩn Sản phẩm có Hoàn tác thay vì xác nhận | Component Patterns › ConfirmDialog |
| CMS dùng Sheet + sidebar | Information Architecture › Điều hướng CMS |
| Sắp xếp bằng nút lên/xuống | Interaction Primitives › CMS; Component Patterns › ProductPicker |
| `/bio` desktop cột 560px | Responsive & Platform |
| Tablet vẫn dùng BottomTabBar | Responsive & Platform |
| Bỏ đánh dấu "đã đăng" được | Component Patterns › MarkPostedDialog |
| Dark tokens loại (A) trong `DESIGN.md` | `DESIGN.md` › frontmatter `colors` |
| Lucide | `DESIGN.md` › Components; Information Architecture › bộ tab |
| Mục tiêu a11y WCAG 2.2 AA | Accessibility Floor |

**Đã duyệt (đợt 2, 2026-11-04)** — giả định thêm khi sửa review, Vinh chấp nhận toàn bộ:

| Giả định | Vị trí trong spine |
|---|---|
| Đích "Xem tất cả" từng khu Trang chủ | Information Architecture › Khu Trang chủ |
| Sản phẩm ghim không lặp ở nhóm Danh mục trên `/bio` | Information Architecture › Bố cục `/bio` |
| Bộ nội dung một cột ≤ 768px trên desktop | Information Architecture › Màn Bộ nội dung |
| "Thêm Bài {nền tảng}" vào bộ có sẵn | Information Architecture › Màn Bộ nội dung (thứ tự 6) |
| Threads > 500 ký tự chặn Duyệt | Component Patterns › SuggestionCard |
| Không thêm/xoá bài trong chuỗi | Component Patterns › SuggestionCard |
| Người đọc chọn sẵn nhóm đầu, Góc viết không chọn sẵn | Component Patterns › AudiencePicker / AnglePicker |
| Bản sửa Người đọc/Góc viết chỉ lưu vào Bộ nội dung | Component Patterns › AudiencePicker / AnglePicker |
| Góc viết bộ nhiều Sản phẩm = gộp từ các hồ sơ | Component Patterns › AudiencePicker / AnglePicker |
| Tạo bộ nội dung cần hồ sơ *Đã duyệt* | Component Patterns › CreateContentSetPanel |
| FR-16 với bài chưa thuộc bộ tạo bộ mới, cần ≥ 1 Sản phẩm | Component Patterns › SocialFromPostDialog |
| ProductPicker chỉ Sản phẩm đang hiện | Component Patterns › ProductPicker |
| Liên kết Cảm hứng chỉ ghi khi tạo Bộ nội dung | Component Patterns › InspirationActions |

**Đã duyệt (đợt 3, 2026-11-05)** — giả định thêm khi đồng bộ với spine:

| Giả định | Vị trí trong spine |
|---|---|
| `/cms` chuyển tới `/cms/bai-viet` tới khi có dashboard thống kê | Information Architecture › CMS |
| Chip Danh mục ở Tìm kiếm mở `/[danh-muc]` | Component Patterns › FilterChips |

**Follow-up cho bmad-architecture:**

- **Góc viết cho bộ nhiều Sản phẩm:** một lần gọi AI tổng hợp góc chung chưa có trong AD-19 — bổ sung nếu cần.
