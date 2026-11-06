---
title: Đối chiếu Stitch ↔ PRD/Architecture (đầu vào cho DESIGN.md / EXPERIENCE.md)
created: 2026-11-04
sources:
  - prds/prd-affiliate-project-2026-11-03/prd.md, addendum.md
  - architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md
  - ux-designs/ui-design-prompt.md
  - ux-designs/ux-affiliate-project-2026-11-03/imports/stitch/*.html (7 màn)
---

# Đối chiếu Stitch với PRD và Architecture

## 1. Các điểm trong PRD/Arch liên quan đến UX

**Người dùng (PRD §2, §3).** Có hai loại người dùng.
- **Vinh**: người vận hành duy nhất, mỗi ngày có khoảng 1 giờ, làm CMS chủ yếu trên điện thoại.
- **Người đọc**: ẩn danh, không có tài khoản (§2.2).

Ngoài phạm vi: cộng tác viên, tài khoản người đọc, phân quyền.

**Hành trình (PRD §2.3):**
- UJ-1: từ Sản phẩm ra bộ nội dung cho 3 nền tảng, trên CMS mobile, mất khoảng 15 phút. Cao trào là màn kết quả có cảnh báo rủi ro.
- UJ-2: Cảm hứng (link TikTok) → từ khoá Shopee và dàn ý → làm tiếp như UJ-1.
- UJ-3: người đọc từ Threads bấm link trong bình luận rồi vào `/bio`, lọc theo danh mục "Nhà bếp" và mua.
- UJ-4: người đọc từ Google vào bài, thả tim, mở bài liên quan, tìm kiếm, bấm link sản phẩm và tin trang vì có nhãn công khai.

**Route public (Arch Structural Seed, AD-26):**
- `/`, `/bai-viet/[slug]`, `/[danh-muc]`, `/[danh-muc]/trang/[n]`.
- `/meo-vat`, `/gom-link`: trang theo Loại bài (FR-28).
- `/bio`, `/tim-kiem` (noindex), 404, `error.tsx`.

Giới hạn kỹ thuật cho UI:
- Site tĩnh, không đọc `searchParams` (AD-7). Vì vậy phân trang phải là đường dẫn `/trang/n`, không dùng "xem thêm" kiểu tải tiếp vô hạn.
- Lượt xem, tim và kết quả tìm kiếm lấy phía client.
- Trạng thái đang tải dùng skeleton qua `<Suspense>`. Nội dung của trạng thái rỗng và lỗi do `EXPERIENCE.md` quy định (AD-12).

**Route CMS (Arch Structural Seed):**
- `/cms/bai-viet`, `/cms/bai-viet/moi`, `/cms/bai-viet/[id]`
- `/cms/san-pham`, `/cms/san-pham/[id]`
- `/cms/bo-noi-dung/[id]`
- `/cms/cam-hung`, `/cms/cam-hung/[id]`
- `/cms/danh-muc`, `/cms/banner`, `/cms/bio`, `/cms/phong-cach`, `/cms/styleguide`

Đăng nhập CMS dùng Basic Auth (`proxy.ts`), tức hộp thoại của trình duyệt, không có màn login riêng.

**Kiểu thiết bị:**
- Site public thiết kế mobile-first, 360–390px, container khoảng 1152px (theo brief).
- `/bio` chủ yếu cho mobile (FR-30).
- CMS ưu tiên điện thoại: UJ-1 và UJ-2 phải làm trọn được trên điện thoại (NFR-4).
- Banner không được vỡ ở màn 360px (FR-32).

**FR có giao diện, phía public:**
- FR-24: Nhãn công khai affiliate tự hiện khi bài có ít nhất 1 Sản phẩm. Trên `/bio` nhãn **luôn nằm ở đầu trang** và không tắt được (FR-30, FR-31).
- FR-25: mọi link Shopee là nguyên link gốc, `rel="sponsored nofollow"`, mở tab mới, không qua `/go`. Render bằng `AffiliateLink` và `AffiliateDisclosure` (AD-11).
- FR-3: giá luôn là **"giá tham khảo" kèm ngày cập nhật giá**. Chỉ có một trường `priceText` cộng `priceUpdatedAt`, không có giá gốc hay giá giảm. Thân bài không chứa giá (FR-13), vì giá lỗi thời có rủi ro pháp lý (R-8).
- FR-26, trang bài viết, gồm:
  - mục lục sinh từ h2, thời gian đọc;
  - breadcrumb **theo Danh mục** (một cấp; Danh mục không có cấp con);
  - thẻ, khối Sản phẩm, nhãn công khai;
  - ít nhất 3 bài liên quan cùng Danh mục.
- FR-29: trang Danh mục **liệt kê Bài web** (không phải Sản phẩm), có phân trang, mô tả danh mục, nằm trong menu và sitemap.
- FR-30 Trang bio:
  - Có: giới thiệu ngắn, nhãn công khai, link về trang chủ.
  - Liệt kê Sản phẩm *hiện*, nhóm theo Danh mục, lọc được theo Danh mục, sản phẩm ghim nổi bật lên đầu.
  - Mỗi thẻ có ảnh, tên, giá tham khảo và nút sang Shopee.
  - **Không có link tuỳ chỉnh nào khác.**
- FR-32 Banner: ảnh, tiêu đề, mô tả, link, thứ tự, bật/tắt, lịch hiển thị. Có thể có 0..n banner.
- FR-33/34: Lượt xem; khu "Xem nhiều" trên trang chủ tính theo 30 ngày. Vẫn giữ các khối nổi bật, mới cập nhật và khối theo Loại bài.
- FR-35: thả tim không cần đăng nhập, bấm lại để bỏ, mỗi trình duyệt một tim.
- FR-36: tìm **Bài web** đã xuất bản, khớp cả khi gõ không dấu.
- FR-37: chia sẻ lên Facebook, Threads, sao chép link; trên mobile dùng chia sẻ gốc của hệ điều hành.

**FR có giao diện, phía CMS:**
- FR-1, FR-2: Cảm hứng. Tạo nhanh chỉ cần link; upload video hoặc ảnh tối đa khoảng 100 MB; lọc theo *mới / đã dùng / bỏ qua*.
- FR-3 đến FR-5: Sản phẩm.
  - Form: tên, link affiliate (kiểm domain Shopee), giá kèm ngày, ảnh (upload hoặc URL thuộc host cho phép), Danh mục do AI gợi ý, dữ liệu thô.
  - Ẩn hoặc hiện bằng 1 thao tác. Khi ẩn, liệt kê các bài và Bộ nội dung đang dùng sản phẩm đó.
  - Trên Sản phẩm thấy được đã đăng lên nền tảng nào (FR-20).
- FR-6 đến FR-11: Hồ sơ nghiên cứu.
  - Thông tin kèm link nguồn, mô tả ảnh, tóm tắt đánh giá (khen / chê / phù hợp).
  - 1–3 nhóm người đọc mục tiêu, từ 3 góc viết trở lên kèm câu hook.
  - Danh mục và Loại bài AI tự điền.
  - Thông báo rõ khi AI bỏ qua ảnh hoặc tìm web (`skipped`).
- FR-12 đến FR-21: Bộ nội dung trên một màn.
  - Gồm Bài web, Threads (chuỗi, mỗi bài ≤ 500 ký tự), Facebook, Bình luận kèm link. Bỏ chọn được nền tảng không cần.
  - Phần nào lỗi thì tạo lại riêng phần đó.
  - Nút copy cho từng bài trong chuỗi, một chạm (FR-19).
  - Đánh dấu đã đăng, kèm link bài đăng tuỳ chọn (FR-20).
  - Tạo lại kèm chỉ dẫn ngắn (FR-21).
- FR-22 Duyệt:
  - Mỗi Gợi ý AI có trạng thái riêng: *GENERATING / PENDING / APPROVED / REJECTED / FAILED / SUPERSEDED* (AD-18).
  - Sửa rồi duyệt, hoặc từ chối.
  - Không xuất bản được Bài web khi chưa duyệt.
  - Copy bài mạng xã hội chưa duyệt vẫn được nhưng **có cảnh báo**.
- FR-23 Cảnh báo rủi ro: chỉ rõ câu bị cảnh báo và lý do. Cảnh báo không chặn Duyệt.
- FR-18 Hồ sơ phong cách cho 3 nền tảng: giọng văn, độ dài, emoji, điều cấm, "câu công khai".
- FR-13: chấm SEO bằng AI (`posts.checkPostSeo`). Kết quả chỉ để xem, không lưu, không qua Duyệt (AD-9).
- FR-27: xem trước bài bằng **đúng component của trang public** (AD-11), xuất bản, chuyển về nháp, xoá có xác nhận, đổi slug thì tự chuyển hướng 301.
- FR-28 Danh mục: CRUD, thứ tự, không xoá được danh mục còn bài hoặc sản phẩm, chặn slug trùng route hệ thống.
- FR-31: quản lý Trang bio (giới thiệu, câu chữ của nhãn, chọn sản phẩm, ghim, sắp thứ tự).
- FR-32: quản lý Banner (hiện tỉ lệ ảnh khuyến nghị).
- FR-38: danh sách bài hiện Lượt xem và Lượt tim, sắp xếp được theo hai chỉ số này.

**NFR:**
- NFR-3: khi AI chạy thì hiện trạng thái xử lý, mỗi thao tác tối đa 90 giây. Rời màn rồi quay lại vẫn thấy kết quả (poller tự refresh mỗi 3 giây, AD-18).
- NFR-2: lỗi AI báo bằng tiếng Việt, không mất dữ liệu đã nhập.
- NFR-5: Core Web Vitals "Tốt" trên mobile. Lượt xem, tim và banner không được làm nhảy layout.
- NFR-11: sáng/tối **theo hệ thống**. Mọi thành phần mới phải đúng ở cả hai chế độ.
- NFR-8: SEO giữ nguyên.
- NFR-7: không thu dữ liệu cá nhân.
- i18n: chỉ tiếng Việt có dấu (Arch Conventions).
- Định dạng số và ngày theo vi-VN; thời gian tương đối chỉ tính phía client (AD-27).
- a11y: PRD không có NFR riêng. Chỉ có trong brief: tương phản AA, vùng bấm ≥ 44px, focus rõ, `prefers-reduced-motion`.
- Form CMS: lỗi hiện tại từng trường, lỗi server hiện bằng toast. Cảnh báo khi rời trang chưa lưu và xác nhận xoá theo `EXPERIENCE.md` (AD-13).

**Ngoài phạm vi (PRD §7, §8.3):**
- Không tự đăng lên Threads/Facebook.
- Không cào dữ liệu Shopee.
- Không theo dõi doanh thu, không đếm click.
- Không tài khoản người đọc, **không newsletter**, **không bình luận** (giai đoạn 2).
- Không link nội bộ trong thân bài.
- Không có nền tảng khác ngoài Website, Threads, Facebook.
- Không có nhiều người vận hành.

**Giai đoạn:**
- 1.5: Banner, Xem nhiều, tim, tìm kiếm, chia sẻ, Cảm hứng.
- 1: còn lại, gồm cả `/bio` và Lượt xem.

## 2. Nội dung từng màn Stitch

Ghi chú chung cho cả 7 màn:
- Đều dùng design system "Warm Editorial Living": primary #a33b19, khác token #C4532F của brief.
- Font Be Vietnam Pro.
- Icon **Material Symbols**, trong khi brief yêu cầu nét mảnh kiểu Lucide.
- **Không màn nào có biến thể dark mode** (0 class `dark:`).
- Có rất ít trạng thái focus và aria.

1. **Trang chủ, mobile.**
   - Header: menu, logo, "Đồ hay", tìm kiếm, **avatar người dùng**.
   - Nút **"Thử tông trầm"** để chuyển theme bằng tay.
   - Hero kiểu banner "Mùa ấm áp".
   - Bài nổi bật, ghi tác giả "Ban Biên Tập".
   - Dải "Gom link đồ xinh": các **thẻ Sản phẩm** kèm mô tả ngắn, "~giá", "Link mua".
   - "Xem nhiều nhất tuần" xếp hạng 01–05, có **số lượt xem**.
   - "Mới cập nhật" có **"142 lưu lại"** (icon tim) và nút "Xem thêm" để tải tiếp.
   - **Form đăng ký newsletter.**
   - Footer có nhãn công khai.
   - **Thanh tab dưới đáy** 5 mục: Tạp chí / Mẹo vặt / Nhà bếp / Gom link / Đồ xinh.
2. **Trang chủ, desktop.**
   - Nav ngang có danh mục, tìm kiếm, "Đồ hay (/bio)", **bookmark** và **avatar**.
   - Hero, bài nổi bật và cột "Xem nhiều". Cột này trộn "lượt lưu", "lượt xem", "lượt đọc".
   - Bảng gom link: thẻ Sản phẩm có huy hiệu "Đã kiểm chứng" / "Top bán chạy", link "Xem tất cả (48+)".
   - "Mới cập nhật" ghi **nhiều tác giả** ("Viết bởi Lan Chi…").
   - **Newsletter.**
   - Khối "Cam kết minh bạch biên tập" ghi "từ trải nghiệm thực tế".
   - Footer có thêm link tới các trang **không có trong PRD**: Mã giảm giá Shopee, Góc mở hộp, Lời ngỏ, Chính sách affiliate, Tiêu chuẩn chọn đồ, Gửi thư.
3. **Bài viết, mobile.**
   - Thanh trên kiểu app: nút back, chia sẻ, avatar.
   - Breadcrumb **3 cấp** (Trang chủ › Mẹo vặt › Vệ sinh nhà bếp), có nhãn Loại bài và một **nhãn phụ** "Chăm sóc tổ ấm".
   - Dòng meta: tác giả · ngày · phút đọc · **1.2k lượt xem**.
   - Nhãn công khai nằm trên ảnh.
   - **Ảnh đầu bài dạng carousel.**
   - Mục lục thu gọn, các h2 có đánh số.
   - Ô "Mẹo nhỏ", trích dẫn.
   - Khối Sản phẩm: huy hiệu "Top Pick / Đã kiểm chứng / Organic", giá "~", nút "Xem trên Shopee".
   - Hashtag, tim (342), sao chép link.
   - 3 bài liên quan, mỗi bài kèm lượt xem.
   - **Thanh nổi dưới đáy**: tim, nhảy tới "Sản phẩm", FB, Threads, chia sẻ.
   - Toast "Đã sao chép".
4. **Bài viết, desktop.**
   - Thanh chia sẻ ở phần đầu bài, nút **"Lưu" (bookmark)**.
   - Mục lục dính ở cột phải, tim nằm trong cột phải.
   - Cột phải có khối **"Góc sắm sửa tin cậy"**: sản phẩm *không thuộc bài*, giá không có "~", link "Xem tất cả đồ hay cho bếp".
   - Hashtag là link.
   - Bài liên quan ghi lượt đọc.
5. **"Chi tiết danh mục", mobile.**
   - Thực chất là **danh mục Sản phẩm của trang bio** ("Về trang Bio / Tất cả danh mục"), không phải trang Danh mục bài viết.
   - Tiêu đề có emoji, "12 món", "Cập nhật hôm qua".
   - Ô tìm trong danh mục.
   - Chip lọc "Dưới 100k", "Nồi & Chảo"…, tức **danh mục con và lọc theo giá**.
   - Sắp xếp "Mới test nhất".
   - Thẻ có **sao 4.9**, **giá gạch** (giá cũ), huy hiệu "Đã test 6 tháng / Best Seller".
   - Có trạng thái rỗng khi lọc.
   - Khối cam kết "tự mua hoặc test kĩ lưỡng".
   - "Khám phá danh mục khác".
   - Tiêu đề trang sai (vẫn ghi "Chi Tiết Bài Viết").
6. **Trang Bio, mobile.**
   - Có avatar, tick verified, @handle.
   - **5 icon mạng xã hội / email.**
   - Ô tìm sản phẩm.
   - Danh sách 9 "danh mục" dạng thẻ dọc, mỗi thẻ có emoji và đếm số món. Một số mục là *bộ sưu tập ảo* ("Món tâm đắc nhất", "Dưới 50k", "Mới test tuần này"). Có nút "Xem thêm 4 danh mục".
   - Khu "Sản phẩm nổi bật": huy hiệu Top Pick, mô tả ngắn, giá, "Mua Shopee".
   - Thẻ **"Bài mới nhất"**.
   - Link "Ghé thăm Website".
   - **Nhãn công khai nằm ở cuối trang.**
   - **Newsletter** kèm trạng thái cảm ơn.
   - Thanh tab dưới đáy.
7. **Tìm kiếm và trạng thái rỗng, mobile.**
   - Ô tìm lớn, nhãn "Không dấu OK".
   - Kết quả ghi "8 bài viết & **12 sản phẩm**", tab Tất cả / Mẹo vặt / **Shopee**.
   - "Gợi ý từ khoá hôm nay".
   - Highlight từ khớp.
   - Meta mỗi kết quả: "lượt lưu".
   - Có **công tắc demo** "Có kết quả / Mô phỏng rỗng / 404".
   - Trạng thái rỗng kèm "Chủ đề được đọc nhiều nhất".

## 3. Khoảng trống

### 3a. Stitch có, nhưng PRD/Arch không hỗ trợ hoặc đã loại

| Thứ trong Stitch | Màn | Đối chiếu | Đề xuất |
|---|---|---|---|
| Form newsletter, "Bản tin Chủ Nhật" | Chủ (M+D), Bio | §7 loại, §8.3 xếp giai đoạn 2 | Bỏ |
| Avatar, icon tài khoản trên header | Mọi màn | §2.2: không có tài khoản người đọc | Bỏ |
| "Lưu" / bookmark, "N lưu lại", "lượt lưu" | Chủ, Bài D, Tìm kiếm | Không có tính năng lưu. Chỉ có Lượt tim (FR-35) | Đổi thành tim, hoặc bỏ số đếm |
| Bình luận | — | Không có màn nào vẽ. Đúng phạm vi | — |
| Thả tim, số tim | Bài M+D | **Có** trong FR-35 (giai đoạn 1.5) | Giữ |
| Chia sẻ FB/Threads/copy, thanh nổi mobile | Bài M+D | **Có** trong FR-37 | Giữ |
| Tìm kiếm Bài web | Tìm kiếm | **Có** trong FR-36 | Giữ |
| Tìm kiếm **cả Sản phẩm**, tab "Shopee" | Tìm kiếm | FR-36 và `searchPosts` chỉ tìm Bài web | Hỏi (Q4) |
| Ô tìm trong trang bio và danh mục sản phẩm | Bio, Danh mục | FR-30 chỉ có lọc theo Danh mục | Hỏi (Q4) |
| "Gợi ý từ khoá hôm nay" | Tìm kiếm | Không có nguồn dữ liệu. Không ghi log tìm kiếm (NFR-7) | Danh sách tĩnh hoặc bỏ |
| **Hiện công khai** số lượt xem trên thẻ và bài | Chủ, Bài, Tìm kiếm | FR-33 chỉ yêu cầu đếm. FR-38 chỉ hiện trong CMS | Hỏi (Q5) |
| Thanh tab dưới đáy mobile | Chủ, Bio, Tìm kiếm | Không có trong PRD. Brief yêu cầu menu dạng drawer. Danh mục thay đổi được | Hỏi (Q6) |
| Nút đổi theme bằng tay "Thử tông trầm" | Chủ M | NFR-11: theo hệ thống | Bỏ, hoặc hỏi |
| Tác giả, nhiều tác giả ("Lan Chi", "Ban Biên Tập") | Chủ, Bài | Không có thực thể tác giả. Chỉ có một người vận hành | Bỏ, hoặc dùng tên cố định |
| Huy hiệu "Đã kiểm chứng", "Đã test 6 tháng", "Top Pick", "Best Seller", "Organic", "Shopee Mall". Câu "tự mua / test kĩ lưỡng" | Bài, Danh mục, Bio, Tìm kiếm | Không có trường dữ liệu. Là khẳng định chưa có căn cứ (đi ngược tinh thần FR-23 và R-8) | Bỏ. Chỉ giữ dấu "Ghim" (FR-30) |
| Mô tả ngắn và tagline trên thẻ Sản phẩm | Mọi thẻ SP | Product chỉ có tên, ảnh, giá, link, danh mục, dữ liệu thô | Hỏi (Q7) |
| **Giá gạch (giá gốc)**, **sao 4.9** | Danh mục SP | FR-3 chỉ có một giá tham khảo kèm ngày. Không có rating | Bỏ |
| Thiếu ngày cập nhật giá | Mọi thẻ SP | FR-3 bắt buộc có | Thêm |
| Danh mục con, nhãn phụ ("Vệ sinh nhà bếp", "Nồi & Chảo"), breadcrumb 3 cấp | Bài, Danh mục | Danh mục chỉ có một cấp. Breadcrumb đi theo Danh mục (FR-26, AD-26) | Breadcrumb: Trang chủ › Danh mục |
| Lọc theo giá ("Dưới 100k/50k"), bộ sưu tập ảo ("Món tâm đắc", "Mới test tuần này"), sắp xếp | Bio, Danh mục | `priceText` là chuỗi, không lọc được. FR-30 chỉ có lọc Danh mục và ghim | Bỏ |
| Danh mục kèm emoji và đếm số món | Bio, Danh mục | Category chỉ có tên, slug, mô tả, thứ tự | Đếm thì được. Emoji: hỏi |
| Icon mạng xã hội / email, @handle, tick verified trên bio | Bio | FR-30: **không có link tuỳ chỉnh nào khác** ngoài link về trang chủ | Bỏ |
| Thẻ "Bài mới nhất" trên bio | Bio | FR-30 chỉ cho link về trang chủ | Hỏi, hoặc bỏ |
| Khối "Góc sắm sửa" ở cột phải: sản phẩm không thuộc bài | Bài D | FR-26 chỉ có khối Sản phẩm của chính bài. Khối này thêm link affiliate không thuộc bài | Bỏ |
| Dải thẻ Sản phẩm trên trang chủ | Chủ | FR-34 giữ "khối theo Loại bài" (bài Gom link). Brief gọi là dải bài | Hỏi (Q8) |
| Ảnh đầu bài dạng carousel | Bài M | Bài chỉ có một ảnh đại diện (FR-13) | Một ảnh 16:9 |
| Footer: Mã giảm giá, Góc mở hộp, Lời ngỏ, Chính sách affiliate, Tiêu chuẩn chọn đồ, Gửi thư | Chủ D, Bài D | Không có route hay trang tĩnh nào trong PRD/Arch | Hỏi (Q9) |
| Hashtag là link | Bài D | Không có route trang thẻ | Hiện dạng chữ, không link |
| "Xem thêm" tải tiếp vô hạn | Chủ M | AD-7: phân trang tĩnh `/trang/n`. Trang chủ không có phân trang | Đổi thành link tới trang Danh mục / Loại bài |
| Công tắc demo "Mô phỏng rỗng / 404" | Tìm kiếm | Chỉ để mô phỏng trong Stitch | Bỏ |
| Material Symbols, primary #a33b19 | Mọi màn | Brief: Lucide (đã có trong code), #C4532F | Hỏi (Q3) |

### 3b. PRD yêu cầu bề mặt/trạng thái public, nhưng Stitch chưa có

- **Trang Danh mục bài viết** `/[danh-muc]` (FR-29): tiêu đề, mô tả, lưới bài, **phân trang**, trạng thái rỗng. Màn "Chi tiết danh mục" của Stitch là danh mục sản phẩm, không phải trang này.
- **Trang Loại bài** `/meo-vat`, `/gom-link` (FR-28) và trang phân trang `/trang/n`.
- **Trang 404** (brief §7), trang lỗi `error.tsx`, skeleton cho từng màn (AD-12).
- **Dark mode** cho mọi màn (NFR-11). Brief yêu cầu ít nhất cho trang chủ và trang bài.
- **Bản desktop và tablet** của Danh mục, Bio, Tìm kiếm.
- Header dạng **drawer** trên mobile, header dính gọn lại khi cuộn. Footer chuẩn (bản mobile và desktop hiện không thống nhất).
- **Banner:** trường hợp 0 banner, nhiều banner dạng carousel, kiểm ở 360px. Banner có link sang Shopee phải theo FR-25.
- **Khối "Mẹo vặt hay"** trên trang chủ: khối theo Loại bài (FR-34, brief §2.6).
- **Trang bio:**
  - nhãn công khai **ở đầu trang**;
  - chip lọc Danh mục cuộn ngang;
  - lưới 2 cột;
  - sản phẩm ghim có dấu nhận biết;
  - trạng thái khi Danh mục không có món;
  - trạng thái bio rỗng.
- **Bài không có sản phẩm:** không hiện nhãn công khai và khối Sản phẩm (FR-24).
- Bài có 1 sản phẩm và bài có 10 sản phẩm (brief); bài liên quan khi có ít hơn 3 bài.
- Trạng thái của tim (đã tim, bỏ tim, lỗi hoặc bị giới hạn tần suất). Trạng thái chia sẻ gốc của hệ điều hành.
- Trạng thái của tìm kiếm: đang tìm, lỗi, gõ không dấu.
- "Giá tham khảo" kèm **ngày cập nhật** trên mọi thẻ Sản phẩm (FR-3).

### 3c. CMS chưa có màn nào trong Stitch (PRD/Arch yêu cầu, ưu tiên mobile theo NFR-4)

| Màn CMS | Route | FR |
|---|---|---|
| Danh sách Bài web: lọc, cột Lượt xem/Lượt tim, sắp xếp | `/cms/bai-viet` | FR-27, FR-38 |
| Soạn/sửa Bài web: editor, SEO, ảnh đại diện, gắn và sắp xếp Sản phẩm, chấm SEO, xem trước, xuất bản/nháp/xoá | `/cms/bai-viet/moi`, `/[id]` | FR-4, FR-13, FR-22, FR-27 |
| Danh sách Sản phẩm: ẩn/hiện, tìm, đã đăng nền tảng nào | `/cms/san-pham` | FR-3–FR-5, FR-20 |
| Chi tiết Sản phẩm: form, dữ liệu thô, upload, **Hồ sơ nghiên cứu** (nguồn, mô tả ảnh, đánh giá, người đọc, góc viết), danh sách nơi đang dùng khi ẩn | `/cms/san-pham/[id]` | FR-3, FR-5–FR-11 |
| **Bộ nội dung**: 4 thẻ Gợi ý AI, trạng thái GENERATING/FAILED và poller, cảnh báo rủi ro, sửa/duyệt/từ chối/tạo lại kèm chỉ dẫn, copy từng bài, đánh dấu đã đăng | `/cms/bo-noi-dung/[id]` | FR-12–FR-23 |
| Kho Cảm hứng: tạo nhanh, lọc theo trạng thái, chi tiết kèm từ khoá và dàn ý | `/cms/cam-hung`, `/[id]` | FR-1, FR-2 |
| Danh mục: CRUD, thứ tự, lỗi khi xoá hoặc slug trùng | `/cms/danh-muc` | FR-28 |
| Banner: CRUD, bật/tắt, lịch, tỉ lệ ảnh | `/cms/banner` | FR-32 |
| Trang bio: giới thiệu, câu chữ nhãn, chọn/ghim/sắp xếp | `/cms/bio` | FR-31 |
| Hồ sơ phong cách cho 3 nền tảng | `/cms/phong-cach` | FR-18 |
| Khung chung: điều hướng CMS trên mobile, toast, xác nhận xoá, cảnh báo rời trang chưa lưu, lỗi AI tiếng Việt, upload ≤ 100 MB kèm tiến trình | `app/cms/*` | NFR-2/3/4, AD-13, AD-24 |

Ghi chú: brief `ui-design-prompt.md` chỉ giao cho Stitch phần site public. Vì vậy thiếu CMS là do phạm vi của brief, không phải Stitch bỏ sót.

## 4. Câu hỏi mở cho người dùng (blocker trước)

1. **[Blocker] Thiết kế CMS bằng gì?** Có hai cách:
   - (a) Brief mới cho Stitch.
   - (b) Đặc tả thẳng trong `EXPERIENCE.md` trên nền shadcn, không cần mockup.

   Màn Bộ nội dung (UJ-1) là trọng tâm và cần thiết kế mobile kỹ.
2. **[Blocker] Stitch dùng làm gì?** (a) Chuẩn hình ảnh, tức giữ phong cách và bỏ các tính năng ngoài phạm vi theo mục 3a. (b) Chỉ để tham khảo. Ở đây "phong cách" là palette, typography, bố cục thẻ.
3. **[Blocker] Design system:** dùng "Warm Editorial Living" (#a33b19, Material Symbols) hay token của brief và code hiện tại (#C4532F, Lucide)? Bỏ hẳn "Botanical Living Editorial"?
4. Tìm kiếm có trả **cả Sản phẩm** không? Bio có cần ô tìm không? PRD hiện chỉ cho tìm Bài web và lọc bio theo Danh mục; muốn mở rộng thì phải sửa PRD và Arch.
5. Có **hiện công khai số lượt xem** (trên thẻ và trong bài) không, hay chỉ hiện số tim? Ngoài ra, số tim trên thẻ ở dạng danh sách có cần không? Mỗi thẻ hiện số tim thì mỗi thẻ phải lấy dữ liệu phía client.
6. Mobile dùng **thanh tab dưới đáy** hay **drawer** như brief? Nếu dùng tab bar thì chứa những mục cố định nào, khi Danh mục thay đổi được?
7. Thẻ Sản phẩm có cần **mô tả ngắn hoặc tagline** không? Nếu có, phải thêm trường vào Product (FR-3); hiện chưa có.
8. Trang chủ: dải "Gom link" là **bài Gom link** (theo PRD và brief) hay **thẻ Sản phẩm** (theo Stitch)?
9. Footer có cần các trang tĩnh (Giới thiệu, Chính sách affiliate…) không? PRD chưa có route nào cho chúng.
10. Các bộ sưu tập ảo trên bio ("Món tâm đắc", "Dưới 50k") có cần không? Hay chỉ dùng Danh mục cộng ghim nổi bật như FR-30/31? Và Danh mục có cần thêm emoji/icon không?

## 5. Quyết định sau (Vinh 2026-11-06)

- **Trang bio theo màn Stitch [Bio-M]**, thay bố cục FilterChips đã chốt trước: đầu trang căn giữa có ảnh đại diện (trường mới `BioSettings.avatar`, sửa ở `/cms/bio`), dòng Danh mục (tên, mô tả 1 dòng, "N món", chevron, "Xem thêm N danh mục"), nhóm "Nổi bật", thẻ "Ghé thăm Website" về `/`. Vẫn bỏ: tick verified, @handle, icon MXH, emoji Danh mục, ô tìm, bộ sưu tập ảo, "Bài mới nhất", newsletter. Khối minh bạch **không** dời xuống cuối như Stitch: FR-24/FR-30 yêu cầu nhãn ở đầu trang, trước Link affiliate. Chi tiết: `EXPERIENCE.md` › Bố cục `/bio`, `DESIGN.md` › Components.
- **Trang bài desktop**: đầu bài và ảnh đầu bài rộng hết khung như Stitch desktop; lưới 8/4 bắt đầu từ thân bài. Giữ khối thả tim cuối bài.
