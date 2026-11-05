# Spine Pair Review — affiliate-project

*Ngày review: 2026-11-04. Phạm vi: `DESIGN.md` + `EXPERIENCE.md` trong `ux-affiliate-project-2026-11-03/`. Các `[ASSUMPTION]` Vinh đã duyệt (memlog 2026-11-04) không bị tính là câu hỏi mở.*

## Overall verdict

Cặp spine dùng tốt cho **site public**. Token đủ hex, có cặp dark cho mọi token được dùng, mọi `{path.to.token}` (71 tham chiếu) đều trỏ đúng, tỉ lệ tương phản đã khai báo khớp với tính toán lại, và cả 4 UJ đều có flow đúng tên, có cao trào và đường lỗi. **Phía CMS còn mỏng.** Màn cao trào của UJ-1 (Bộ nội dung) chưa có bố cục. Chưa có pattern cho bước chọn Người đọc mục tiêu / Góc viết. FR-16 và Bộ nội dung nhiều Sản phẩm (bài Gom link) chưa có lối vào. Ngoài ra còn vài quyết định tự mâu thuẫn: hành vi bấm ProductCard, số SuggestionCard, nút 36px so với sàn 44px. Nên sửa 6 mục high trước khi chuyển sang story-dev.

## 1. Flow coverage — adequate

Đã kiểm: trích UJ-1..UJ-4 từ PRD §2.3 và FR-1..FR-38 có giao diện; đối chiếu với Key Flows (EXPERIENCE L241–292). Cả 4 UJ đều có protagonist (Vinh / người đọc ẩn danh, đã ghi rõ lý do chưa đặt tên), bước đánh số, **Cao trào** và đường lỗi. Có thêm Flow 5 (Ẩn Sản phẩm, FR-5/R-2), là phần bổ sung tốt.

### Findings
- **high** UJ-1 bước 3–4 chưa có pattern cho bước chọn: "1–3 Người đọc mục tiêu (chọn một), ≥ 3 Góc viết kèm hook (chọn một)" chỉ nằm trong văn kể flow. Không có component nào (radio/thẻ chọn, sửa lại theo FR-9) và không có điều kiện tiên quyết của "Tạo bộ nội dung": hồ sơ có buộc phải *Đã duyệt* không, bắt buộc chọn góc không, hồ sơ FAILED/REJECTED thì sao (EXPERIENCE L62, L134, L249–250). *Fix:* thêm hàng `ResearchProfileCard` / `AnglePicker` vào Component Patterns của cả hai spine. Ghi rõ: nút Tạo tắt khi chưa chọn Góc viết, và nêu hành vi khi hồ sơ chưa Duyệt.
- **high** Thiếu lối vào cho **FR-16** (từ Bài web có sẵn tạo Bài Threads/Facebook) và cho **Bộ nội dung nhiều Sản phẩm** (PRD §4.3: bài Gom link có nhiều Sản phẩm, Góc viết gợi ý từ mọi hồ sơ). Mọi flow và IA chỉ bắt đầu từ một `/cms/san-pham/[id]` (EXPERIENCE L60–63; không có chỗ nào nhắc FR-16). *Fix:* thêm nút "Tạo bài mạng xã hội" ở Soạn Bài web. Định nghĩa cách chọn nhiều Sản phẩm trước "Tạo bộ nội dung" (ví dụ ProductPicker trên màn Bộ nội dung mới). Thêm một flow ngắn hoặc một dòng trong IA.
- **medium** UJ-1 bước 5 "Duyệt bài web, mở bài, chạm Xuất bản. Quay lại…" không nêu điều hướng giữa `/cms/bo-noi-dung/[id]` và `/cms/bai-viet/[id]`: link nào, nút nào, quay lại bằng gì (EXPERIENCE L251). *Fix:* SuggestionCard Bài web đã Duyệt có link "Mở bài web"; Soạn Bài web có link ngược về Bộ nội dung.
- **medium** UJ-2 bước 3 "Gắn sản phẩm" chỉ tạo Sản phẩm mới. Chưa nói có gắn được Sản phẩm có sẵn không, và trạng thái *Bỏ qua* của Cảm hứng do thao tác nào đặt (EXPERIENCE L260, L64). *Fix:* thêm hàng Component Patterns cho "Gắn sản phẩm" (tạo mới hoặc chọn có sẵn) và nút "Bỏ qua" trên chi tiết Cảm hứng.
- **low** UJ-4 bước 2 "Mở TableOfContents" mâu thuẫn với TOC mobile **mặc định mở** (EXPERIENCE L109, L281). *Fix:* đổi thành "Chạm 'Mẹo 2' trong mục lục".

## 2. Token completeness — adequate

Đã kiểm: 49 màu light + 32 màu dark, 12 typography, 6 rounded, 12 spacing, 15 component token; toàn bộ `{…}` trong cả hai file đều có định nghĩa; giá trị đúng kiểu theo `design-md-spec.md`. Đã tính lại tương phản: 16.25 / 8.89 / 6.57 / 6.26 / 4.54 / 4.58, dark 14.47 / 6.56 / 5.0 / 5.34 — khớp với DESIGN L184. Không có token màu nào thiếu hex.

### Findings
- **high** `affiliate-link-button.height: 36px` và `chip.height: 36px` (DESIGN L140, L143) thấp hơn `{spacing.touch-target}` 44px, trong khi EXPERIENCE L197 quy định "Mọi vùng bấm ≥ 44px". AffiliateLink là nút tạo ra doanh thu và lại dày đặc trên mobile. *Fix:* chốt một trong hai cách: (a) nâng lên 44px, hoặc (b) giữ hình 36px nhưng vùng bấm 44px (padding / pseudo-element), ghi rõ trong DESIGN Components.
- **medium** 15 token light không có cặp `-dark`: `primary-fixed-dim`, `on-primary-fixed-variant`, `inverse-primary`, `surface-tint`, `secondary-fixed`, `secondary-fixed-dim`, `on-secondary-fixed`, `on-secondary-fixed-variant`, `on-tertiary`, `tertiary-container`, `on-tertiary-container`, `tertiary-fixed-dim`, `on-tertiary-fixed-variant`, `surface-dim`, `surface-bright` (DESIGN L17–65). Hiện chưa token nào trong số này được dùng, nhưng code mirror toàn bộ frontmatter thành CSS variable thì dark mode sẽ thiếu biến (NFR-11). *Fix:* ghi chú "chỉ light, không dùng trong component", hoặc bỏ khỏi frontmatter.
- **medium** PostCard *rank* dùng số `01`–`05` màu `{colors.outline-variant}` (1.7:1, DESIGN L244), mâu thuẫn với bảng màu "Đường kẻ — không dùng cho chữ (1.6:1)" (L179). *Fix:* coi số là trang trí (`aria-hidden`, thứ tự do `<ol>` đảm nhận) và ghi rõ ngoại lệ, hoặc đổi sang `{colors.on-surface-variant}`.
- **low** Thiếu khai báo tương phản cho vài cặp quan trọng: giá `{colors.primary-dark}` trên thẻ `surface-container-lowest-dark` chỉ đạt 4.54:1 (sát ngưỡng); badge Gom link (13.3 light / 5.06 dark), badge Mẹo vặt dark (5.88); vòng focus ≥ 3:1 (không phải chữ). *Fix:* bổ sung vào DESIGN L184.
- **low** Còn số literal ở chỗ đã có token: gutter tablet "24px" (= `{spacing.gutter-desktop}`), header "64px" trong văn (DESIGN L209, L213). *Fix:* dùng tên token.

## 3. Component coverage — thin

Đã kiểm: site public có 23 component, đều có hàng trong cả DESIGN.Components (L239–261) và EXPERIENCE.Component Patterns (L99–121), quy tắc thật. CMS có 16 component đủ hàng hành vi (L127–143), **nhưng phần hình ảnh chỉ là một dòng gộp** (DESIGN L262).

### Findings
- **high** Màn Bộ nội dung, nơi diễn ra cao trào UJ-1 và NFR-4, không có đặc tả bố cục. Chưa rõ: thứ tự và cách xếp thẻ trên 360px (xếp chồng hay tab), cách hiển thị chuỗi Threads (mỗi bài một khối + CopyButton + đếm ký tự ≤ 500), vùng sửa nội dung trong SuggestionCard (textarea hay rich text), vị trí nút Duyệt/Từ chối/Tạo lại trên mobile. Toàn bộ chỉ nằm trong DESIGN L262. *Fix:* tách hàng DESIGN riêng cho SuggestionCard, GeneratingIndicator, RiskWarning, CopyButton (anatomy, mobile). Thêm bảng bố cục màn `/cms/bo-noi-dung/[id]` trong EXPERIENCE.
- **high** "4 SuggestionCard" (EXPERIENCE L63, L250) mâu thuẫn với FR-17 ("với **mỗi** Bài mạng xã hội") và AD-19 (`LINK_COMMENT` khoá theo `contentSetId + platform`). Đủ 3 nền tảng thì có **5** gợi ý: Bài web, Threads, Facebook, 2 Bình luận kèm link. Bỏ chọn nền tảng thì số thẻ cũng đổi. *Fix:* mô tả theo quy tắc: 1 thẻ cho mỗi nền tảng đã chọn, cộng 1 Bình luận kèm link cho mỗi nền tảng mạng xã hội, và ghi rõ Bình luận nằm trong thẻ của nền tảng hay là thẻ riêng.
- **high** Hành vi bấm ProductCard tự mâu thuẫn. L106 viết "Chỉ AffiliateLink bấm được (ảnh và tên cũng mở cùng link affiliate)", còn L306 ghi "thẻ Sản phẩm bấm cả thẻ". Câu này ảnh hưởng số thẻ `<a rel="sponsored">`, link trùng cho trình đọc màn hình và vùng bấm. *Fix:* chốt một cách, ví dụ: ảnh + tên + nút là một link duy nhất (stretched link), nút chỉ là phần hiển thị; ghi lại trong Accessibility Floor.
- **medium** ProductCard chỉ có một biến thể ngang (ảnh 80px bên trái; DESIGN L246) nhưng được dùng ở dải cuộn ngang và lưới 4 cột trang chủ (EXPERIENCE L229) và ở `/bio`. FR-30 "nhóm theo Danh mục" chưa có bố cục nhóm: có tiêu đề nhóm không, chỉ ở chip "Tất cả" hay không, Sản phẩm ghim nằm trên hay trong nhóm. *Fix:* thêm biến thể *tile* (dọc) cho dải/lưới và bảng bố cục `/bio`.
- **medium** Banner trỏ Shopee "render qua AffiliateLink" (EXPERIENCE L103, AD-11), nhưng AffiliateLink trong DESIGN là nút cố định chữ "Xem trên Shopee" (L247), còn CTA Banner là pill `{colors.primary}`. *Fix:* nêu AffiliateLink là component thuộc tính link (nhận children / variant) và tách phần hình ảnh của nút.
- **medium** Thiếu component cho các thứ đang được nhắc tới: trình soạn thân Bài web (Soạn Bài web, FR-13/27), bộ chọn / ghim / sắp xếp Sản phẩm cho `/cms/bio` (FR-31; ProductPicker chỉ ghi "Soạn Bài web"), hiển thị thẻ/hashtag trên bài (FR-26; chỉ có dòng Do's L276), dải thông báo `skipped` trong Hồ sơ nghiên cứu (L182), khu "bài liên quan" dùng biến thể PostCard nào. *Fix:* thêm hàng tương ứng vào cả hai spine.
- **medium** Màu StatusBadge chưa phủ hết: DESIGN L262 chỉ có chờ duyệt / đã duyệt–đã đăng / lỗi / đang tạo. Thiếu Nháp, Đã xuất bản, Hiện, Ẩn, Mới, Đã dùng, Bỏ qua, Đã từ chối, Chưa đăng và trạng thái Banner (Tắt / Chờ lịch / Hết hạn / Đang hiện). Hàng StatusBadge trong EXPERIENCE L129 cũng chưa có nhóm Banner (nhóm này chỉ có ở L189). *Fix:* thêm bảng nhãn → token đầy đủ.

## 4. State coverage — adequate

Đã kiểm từng bề mặt trong IA. Site public: đang tải, lỗi, ngoại tuyến (đã duyệt bỏ qua), các kiểu rỗng (0 Banner, Xem nhiều, liên quan, Danh mục, bio), slug cũ, trang vượt quá, focus, tìm kiếm (chưa gõ / đang tìm / rỗng / lỗi), 404. CMS: đang tải, không tìm thấy, danh sách rỗng, lọc không ra, vòng đời Gợi ý AI, `skipped`, lỗi trường, xoá bị chặn, upload, lỗi AI. Phủ tốt; còn thiếu:

### Findings
- **medium** "Bài nổi bật" chưa có nguồn: schema không có trường featured, spine không nói lấy bài mới nhất, ghim hay gì khác (EXPERIENCE L31, L154; DESIGN L193). Link "Xem tất cả" của khu Xem nhiều và Mới cập nhật cũng chưa có đích (L31 chỉ có `/meo-vat`, `/gom-link`, không có route "mọi bài"). *Fix:* chốt quy tắc chọn, ví dụ "bài đã xuất bản mới nhất có ảnh", và đích của từng link "Xem tất cả".
- **medium** Chưa có trạng thái ảnh lỗi tải: ảnh Sản phẩm/Banner từ host ngoài (Shopee CDN) hỏng hoặc bị gỡ, trên ProductCard / PostCard / Banner. *Fix:* fallback là khung `{colors.surface-container}` cùng tỉ lệ + icon, alt giữ nguyên.
- **low** Còn thiếu vài trạng thái: tìm kiếm khi mới gõ 1 ký tự (dưới ngưỡng 2), sao chép link thất bại (clipboard bị chặn), người dùng huỷ `navigator.share` (EXPERIENCE L112, L117). *Fix:* thêm ba dòng vào State Patterns.
- **low** CMS chưa nói gì về mất mạng hoặc Basic Auth hỏi lại khi đang gửi form (NFR-2 "không mất dữ liệu"). *Fix:* một dòng: giữ dữ liệu form, Toast "Chưa gửi được, kiểm tra mạng rồi thử lại".

## 5. Visual reference coverage — strong

Tệp trong `imports/stitch/`: 7 `.html`, 7 `.png`, `ds-warm-editorial-living.{json,md}`, `ds-botanical-living-editorial.{json,md}`, `project-DESIGN.md`. Không có `mockups/` hay `wireframes/`. Cả 7 HTML đều được dẫn inline ở IA (EXPERIENCE L31–36) và cột Mockup (DESIGN L239–261), có nói rõ minh hoạ gì, kể cả màn "chi tiết danh mục" = trạng thái bio đã lọc. Botanical được ghi rõ là không dùng. Câu "spine thắng" có ở cả hai file và nhất quán.

### Findings
- **low** `ds-warm-editorial-living.md` chỉ có trong `sources` của frontmatter, không được nhắc trong thân bài; file `.png` chỉ được nhắc chung một câu (DESIGN L163). *Fix:* nhắc một lần trong Colors hoặc bỏ khỏi `sources`.
- **low** Một số tham chiếu chưa cụ thể: SiteFooter "các màn mobile", PostTypeBadge "mọi màn", glob `trang-chu-*`. ProductCard dẫn `chi-tiet-danh-muc-*`, màn có giá gạch và sao (đã bị loại) (DESIGN L242–246). *Fix:* nêu tên file cụ thể và chỉ rõ phần nào là chuẩn ("chỉ bố cục ảnh–tên–giá").

## 6. Bloat & overspecification — adequate

DESIGN giữ giọng biên tập vừa phải, mỗi đoạn đều gắn với một quyết định. EXPERIENCE gần như toàn bảng, không có văn kể trang trí. Phần Foundation nhắc lại ràng buộc AD-7/AD-12 nhưng có ích vì đó là ràng buộc UX trực tiếp.

### Findings
- **medium** Nhãn `[ASSUMPTION]` rải khoảng 25 chỗ, dòng L306 vẫn ghi "Giả định khác **cần duyệt**", và cả hai file đều `status: draft`, trong khi memlog L21–22 ghi Vinh đã duyệt toàn bộ và bỏ Reviewer Gate. Agent story-dev sẽ hiểu đây là quyết định chưa chốt. *Fix:* đổi tiêu đề thành "Giả định đã duyệt (2026-11-04)", sửa L306, đặt `status: final` sau khi xử lý các mục high; có thể đổi nhãn thành `[ĐÃ DUYỆT]`.
- **low** Danh sách phần Stitch bị loại lặp ở ba nơi: DESIGN Do's L272/L277, EXPERIENCE Inspiration L238, `reconcile-stitch.md` §3a. Ba bản có thể lệch nhau dần. *Fix:* giữ danh sách đủ ở DESIGN Do's and Don'ts; EXPERIENCE chỉ dẫn tới đó.

## 7. Inheritance discipline — adequate

Đã kiểm: mọi đường dẫn trong `sources` đều tồn tại. Tên UJ-1..UJ-4 khớp nguyên văn PRD. Thuật ngữ PRD §3 (Bộ nội dung, Gợi ý AI, Hồ sơ nghiên cứu, Góc viết, Người đọc mục tiêu, Bình luận kèm link, Giá tham khảo, Trang bio, Loại bài) dùng đúng. Trạng thái khớp PRD/AD-18. Tham chiếu token trong EXPERIENCE (`{spacing.touch-target}`, `{colors.primary}`) đều có trong DESIGN.

### Findings
- **medium** Ý nghĩa màu tự mâu thuẫn trong DESIGN: `tertiary-fixed` (Gom link) ghi "Không dùng cho: cảnh báo" (L177) nhưng RiskWarning và trạng thái "chờ duyệt" lại dùng chính nó (L262). `secondary-container` (Mẹo vặt) ghi "Không dùng cho: trạng thái thành công" (L176) nhưng "đã duyệt / đã đăng" dùng nó (L262). *Fix:* giới hạn cột "Không dùng cho" trong site public, hoặc cho CMS cặp token riêng.
- **medium** Route `/meo-vat/trang/[n]`, `/gom-link/trang/[n]` (EXPERIENCE L34) không có trong cây route của Architecture (Structural Seed chỉ có `[danh-muc]/trang/[n]`; AD-7). Pagination L115 cũng chỉ mô tả mẫu Danh mục. *Fix:* hoặc bỏ phân trang Loại bài, hoặc đánh dấu là thay đổi cần cập nhật Arch và viết quy tắc đường dẫn cho cả hai loại.
- **medium** Định dạng ngày cập nhật giá không thống nhất: "cập nhật dd/mm" (DESIGN L246), "cập nhật 12/10" (EXPERIENCE L80), "cập nhật hôm qua" (EXPERIENCE L272). *Fix:* chốt một cách; nếu dùng thời gian tương đối thì ghi rõ nó đi qua `relative-time.client.tsx` (AD-27) và có fallback tuyệt đối.
- **low** Tên component lệch nhau: GeneratingIndicator (spine) và `generating-poller.client.tsx` (AD-18); "Form CMS" chỉ có ở EXPERIENCE L143; key frontmatter `affiliate-link-button` / `toc` khác tên AffiliateLink / TableOfContents. *Fix:* ghi ánh xạ tên, hoặc nêu GeneratingIndicator bọc poller của AD-18.
- **low** Thứ tự các khu trên Trang chủ khác nhau: IA (L31) đặt Xem nhiều trước dải Gom link, Responsive (L227) đặt Gom link trước Xem nhiều. *Fix:* để Responsive làm nguồn duy nhất cho thứ tự; IA chỉ liệt kê.

## 8. Shape fit — strong

DESIGN đúng thứ tự chuẩn: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. EXPERIENCE có đủ mục mặc định (Foundation, IA, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows). Có thêm Responsive & Platform (cần, vì có nhiều breakpoint) và Inspiration & Anti-patterns (xứng đáng, vì ghi lại các phần bị loại khỏi Stitch). Tách subsection Site public / CMS rõ ràng.

### Findings
- **low** Mục tự thêm "Open Questions / Giả định cần duyệt" không còn câu hỏi nào mở, nên tên mục gây hiểu nhầm (xem finding medium ở mục 6). *Fix:* đổi tên thành "Giả định đã chốt".
- **low** Frontmatter EXPERIENCE không có `name` (các ví dụ đều có); `sources` của DESIGN không có `addendum.md` trong khi EXPERIENCE có. *Fix:* thêm `name: Mẹo Vặt Cuộc Sống` và thống nhất danh sách sources.

## Mechanical notes

- **Cross-ref:** 71 tham chiếu `{colors|typography|rounded|spacing|components.*}` duy nhất trong hai file, tất cả đều trỏ đúng. Không có tham chiếu gãy. `button-primary` có định nghĩa nhưng thân bài không nhắc tới (không hại gì).
- **YAML:** frontmatter của cả hai file parse được (PyYAML). DESIGN dùng inline flow map và comment `(S)/(A)`, hợp lệ.
- **Frontmatter:** DESIGN có `name`, `description` và đủ khối token; EXPERIENCE thiếu `name`. Cả hai đều `status: draft`, cần đổi khi chốt.
- **Tên lệch:** GeneratingIndicator ↔ GeneratingPoller (AD-18); "Đồ hay" ↔ "Trang bio" (đã duyệt, chỉ là nhãn điều hướng); `affiliate-link-button` ↔ AffiliateLink; `toc` ↔ TableOfContents.
- **Mâu thuẫn số liệu:** "4 SuggestionCard" ↔ AD-19/FR-17; chiều cao 36px ↔ touch-target 44px; định dạng ngày giá (3 kiểu).
- **Route:** `/meo-vat/trang/[n]`, `/gom-link/trang/[n]` không có trong Structural Seed của Arch.
- **Mermaid:** không có sơ đồ nào; không cần kiểm.
- **Tương phản:** tính lại khớp với số trong DESIGN L184 (sai lệch ≤ 0.02).
