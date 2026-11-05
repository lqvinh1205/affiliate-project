# Đối chiếu đầu vào với PRD — 2026-11-03

So sánh `prd.md` + `addendum.md` với ba nguồn: tài liệu ý tưởng gốc, research digest và code hiện tại (commit `dfd7e8f`). Chỉ ghi những điểm **chưa được phản ánh** trong PRD mà có thể quan trọng. Các khác biệt đã biết và có chủ đích (hoãn cào Shopee/ScrapingBee, bỏ OpenAI, link đi qua bình luận thẳng sang Shopee, Next 16) cùng chi tiết code/schema không được tính là lỗ hổng.

Mức độ: **[Cao]** nên sửa PRD trước khi làm UX/kiến trúc · **[Vừa]** nên thêm một dòng · **[Thấp]** ghi nhận.

---

## 1. `docs/PRD_AFFILIATE_PROJECT.md` (ý tưởng gốc)

### 1.1 [Cao] Giọng văn thương hiệu mặc định không được ghi lại
- **Nguồn:** dòng 127: *"Văn phong của bạn cá nhân hóa sâu sắc, sử dụng ngôn ngữ hóm hỉnh, Gen-Z."*; dòng 170: *"đoạn hội thoại siêu ngắn gọn (dưới 250 kí tự mỗi đoạn), dùng nhiều emoji làm điểm nhấn."* Code hiện tại đã tinh chỉnh thành *"gần gũi, dí dỏm vừa phải kiểu Gen-Z nhưng rõ ràng, hữu ích, không sến, không phóng đại"* (`lib/ai.ts:47`).
- **PRD:** FR-16 cho phép sửa Hồ sơ phong cách nhưng không nói giọng văn **mặc định** của thương hiệu là gì. Không có mục "giọng thương hiệu / brand voice" nào.
- **Đề xuất:** thêm vào §4.4 (hoặc FR-16) một tiêu chí: "Hồ sơ phong cách được khởi tạo sẵn với giọng thương hiệu: gần gũi, dí dỏm vừa phải kiểu Gen-Z, cá nhân hoá, không sến, không phóng đại, không giật tít sai sự thật". Ghi luôn các giá trị khởi tạo cho Threads (mỗi bài < 250 ký tự hoặc theo giới hạn, emoji làm điểm nhấn, bài 1 là hook) để UX/epics không phải đoán.

### 1.2 [Vừa] Quy chuẩn bài web (độ dài, cấu trúc, giới hạn SEO) chỉ có trong code
- **Nguồn:** ý tưởng gốc dòng 136 (*"chia nhỏ thành các thẻ h2, h3, lồng ghép mẹo vặt thực tế và khéo léo chèn sản phẩm"*); code `lib/ai.ts:51-55`: 600–900 từ, 3–5 mục h2, title ≤ 70, seoTitle ≤ 60, seoDescription 140–160, excerpt ≤ 200, 3–5 tag, 3–6 từ khoá, không chèn link/ảnh/giá vào thân bài.
- **PRD:** FR-11 chỉ liệt kê các trường, không có tiêu chí đo được.
- **Đề xuất:** đưa các con số này vào Hồ sơ phong cách Website làm giá trị mặc định (FR-16), hoặc thêm tiêu chí cho FR-11. Đặc biệt quy tắc "không đặt giá trong thân bài" nên giữ (xem 1.6).

### 1.3 [Vừa] Liên kết nội bộ (internal linking) bị bỏ lặng lẽ
- **Nguồn:** dòng 313: *"cấu trúc liên kết nội bộ (Internal Linking) đạt tiêu chuẩn tối đa"*.
- **PRD:** không có FR nào về liên kết nội bộ. "Bài liên quan" (đang có) không được nhắc. UJ-4 có "bấm sang bài cùng danh mục" nhưng không có FR tương ứng. Code hiện cấm link trong thân bài (sanitize), nên liên kết nội bộ chỉ có qua khối "Bài liên quan" và breadcrumb.
- **Đề xuất:** thêm FR "Bài liên quan": mỗi Bài web hiện ≥ 3 bài cùng Danh mục (hoặc cùng thẻ). Quyết định rõ: có cho AI gợi ý/chèn link nội bộ vào thân bài không (nếu có thì phải nới quy tắc sanitize). Nếu không, ghi vào §7.

### 1.4 [Vừa] Bộ 10 chủ đề mẫu = gợi ý sẵn cho Danh mục ban đầu và kế hoạch nội dung
- **Nguồn:** dòng 311-324: 10 bài mẫu phủ các chủ đề nhà bếp/vệ sinh, decor phòng ngủ, giặt giũ/tủ đồ, thời trang phụ kiện giá sinh viên, cây cảnh, góc học tập, làm đẹp/skincare, du lịch. Code đã seed 10 bài này (`prisma/seed.ts`, slug bài 8, 9 hơi khác bản gốc).
- **PRD:** Câu hỏi mở 6 hỏi "gán Danh mục ban đầu thế nào" mà không dùng gợi ý này; không có danh sách Danh mục khởi tạo nào; không nhắc dữ liệu seed.
- **Đề xuất:** thêm vào §10 câu hỏi 6 (hoặc §8.1) đề xuất bộ Danh mục khởi tạo suy từ 10 chủ đề (ví dụ Nhà bếp, Nhà cửa & Decor, Giặt giũ & Tủ đồ, Làm đẹp, Thời trang, Cây cảnh, Học tập & Làm việc, Du lịch) để Vinh xác nhận. Ghi rõ số phận 10 bài seed: giữ làm nội dung thật, viết lại, hay xoá trước khi ra mắt.

### 1.5 [Vừa] Ảnh đại diện bài viết không có trong FR
- **Nguồn:** schema gốc có `featuredImage` **bắt buộc** (dòng 36). Code: ảnh đại diện tuỳ chọn, rơi về ảnh sản phẩm đầu tiên rồi placeholder (`lib/posts.ts` `toCard`).
- **PRD:** FR-11 liệt kê tiêu đề, tóm tắt, nội dung, thẻ, SEO… nhưng không có ảnh đại diện; FR-3 có upload ảnh cho Sản phẩm nhưng Bài web thì không. Ảnh này dùng cho OG (FR-30 chia sẻ), JSON-LD và thẻ bài trên trang chủ.
- **Đề xuất:** thêm vào FR-11: "Bài web có ảnh đại diện (tải lên hoặc chọn từ ảnh Sản phẩm); nếu trống thì dùng ảnh Sản phẩm đầu tiên". Có thể để AI gợi ý ảnh từ Dữ liệu thô.

### 1.6 [Vừa] Giá sản phẩm dễ lỗi thời
- **Nguồn:** schema gốc `price String?`; các bài mẫu nhấn giá ("dưới 100k", "từ 10k", "giá sinh viên").
- **PRD:** FR-3 có trường giá nhưng không nói gì về việc giá trên Shopee thay đổi. Giá sai trên website/bài MXH có thể bị coi là thông tin quảng cáo sai (liên quan R-1, R-2).
- **Đề xuất:** thêm tiêu chí FR-3: giá hiển thị là "giá tham khảo" kèm ngày cập nhật, hoặc cho phép ẩn giá. Thêm vào FR-21: cảnh báo khi Góc viết dựa vào mức giá ("dưới 100k") mà giá đã cũ.

### 1.7 [Thấp] Tên miền / tên thương hiệu
- **Nguồn:** dòng 88: `NEXT_PUBLIC_SITE_URL="https://meovatcuocsong.vn"`; tiêu đề "Mẹo Vặt Cuộc Sống & Gom Link Đồ Đẹp".
- **PRD:** dòng 9 ghi "Tên làm việc — cần xác nhận" nhưng không đưa vào §10.
- **Đề xuất:** thêm Câu hỏi mở: xác nhận tên thương hiệu và tên miền (ảnh hưởng tên hiển thị trong JSON-LD, OG, tiêu đề trang).

### 1.8 [Thấp] Nội dung mới lên website nhanh, không gián đoạn
- **Nguồn:** dòng 11: ISR — *"Khi có bài viết mới hoặc cập nhật từ CMS, trang được tái cấu trúc ngầm"*.
- **PRD:** NFR-5 nói về Core Web Vitals, không nói độ trễ từ lúc xuất bản/sửa/ẩn đến lúc website hiển thị. Việc này quan trọng với R-2 (ẩn Sản phẩm vi phạm phải có hiệu lực ngay).
- **Đề xuất:** thêm vào NFR-5: "Xuất bản, sửa, gỡ bài hoặc ẩn Sản phẩm hiện trên website trong vòng ~1 phút, không cần deploy lại".

*(Ghi nhận, không phải lỗ hổng: ý gốc "Threads kéo traffic về website qua CTA link bio" (dòng 152, 174) đã đổi có chủ đích thành link thẳng sang Shopee. Hệ quả là website gần như không nhận traffic từ Threads/FB; PRD có thể ghi một dòng ở §1 rằng traffic website chủ yếu đến từ Google, để SM-4 đặt kỳ vọng đúng.)*

---

## 2. `research-landscape.md`

### 2.1 [Cao] R-3 đề xuất "test bằng một đơn thật" có thể là tự mua, bị cấm
- **Nguồn:** dòng 11: *"Quy tắc cấm (tự mua, cloaking/redirect qua domain riêng)…"*; dòng 10: *"Mất hoa hồng khi: … đơn vi phạm"*.
- **PRD:** R-3 và Câu hỏi mở 5 bảo Vinh "test bằng một đơn thật". Nếu Vinh tự bấm link của mình và tự mua, đó có thể là tự mua — vi phạm điều khoản, có thể mất hoa hồng hoặc bị khoá tài khoản.
- **Đề xuất:** sửa R-3: test bằng cách nhờ người khác đặt đơn, hoặc chỉ kiểm tra click có được ghi nhận trong báo cáo Click của Shopee Affiliate (không cần đơn). Thêm "Vinh không tự mua qua link của mình" vào ràng buộc.

### 2.2 [Cao] Cấm redirect/cloaking chưa thành ràng buộc trong PRD
- **Nguồn:** dòng 11: *"dùng link chính chủ `s.shopee.vn`; đọc lại điều khoản trước khi làm redirect `/go/xyz`"*.
- **PRD:** FR-3 chỉ đòi "link hợp lệ". Không có ràng buộc rằng website không được bọc link qua domain riêng — trong khi một bản sau rất dễ thêm `/go/…` để đếm click.
- **Đề xuất:** thêm vào §6 (R mới) hoặc tiêu chí FR-3: "Link affiliate hiển thị nguyên link Shopee chính chủ, không đi qua redirect của website, cho tới khi kiểm điều khoản". FR-3 có thể kiểm link thuộc domain Shopee (`s.shopee.vn`, `shopee.vn`, `shope.ee`).

### 2.3 [Vừa] Không đo được click ra Shopee nên SM-1 khó gắn với nội dung
- **Nguồn:** dòng 23-24: Linktree/Beacons đo click/CTR theo link; *"click tracking + sub_id theo bài/kênh"*.
- **PRD:** loại `sub_id` (§7, có chủ đích) nhưng cũng không có cách nào đo click nút "Xem trên Shopee" trên website. Vinh chỉ biết lượt xem và tim, không biết bài nào ra click. JTBD "biết bài nào được đọc nhiều để làm thêm" chỉ đúng một nửa.
- **Đề xuất:** cân nhắc thêm FR (giai đoạn 1.5) đếm click nút sản phẩm trên website mà không đổi link (sự kiện phía client, không redirect — tương thích 2.2). Nếu không làm, ghi rõ vào §7.

### 2.4 [Vừa] Nghĩa vụ thuế và xác thực danh tính không có trong PRD
- **Nguồn:** dòng 9-10: khấu trừ 10% TNCN khi hoa hồng kỳ ≥ 2 triệu; *"mất hoa hồng khi … chưa khai báo thu nhập"*; dòng 31: Luật TMĐT — affiliate phải xác thực danh tính.
- **PRD:** R-2 nhắc xác thực danh tính, không nhắc thuế/khai báo thu nhập. SM-1 dựa vào "hoa hồng thực nhận" nên các khoản khấu trừ ảnh hưởng mục tiêu.
- **Đề xuất:** thêm một dòng vào §6 (ngoài phạm vi sản phẩm, việc vận hành): khai báo thu nhập, 10% TNCN, xác thực danh tính trước 01/7/2026. Ghi SM-1 tính sau thuế hay trước thuế.

### 2.5 [Thấp] Một số mục chưa xác minh nhưng PRD viết như sự thật
- **Nguồn:** research gắn [?] cho mức phạt Luật Quảng cáo (dòng 30), Điều 26 Luật TMĐT (dòng 31), cookie 7/30 ngày (dòng 6).
- **PRD:** R-1, R-2 nêu nghĩa vụ như đã chắc. Cookie window không được nhắc — nó ảnh hưởng cách đọc SM-1 (đơn ngoài 7 ngày không tính).
- **Đề xuất:** đánh dấu `[chưa xác minh]` ở R-1/R-2 và thêm mục "Cần kiểm thủ công" (research dòng 37) vào §10 làm việc của Vinh trước khi đăng đều.

---

## 3. Code hiện có — năng lực dễ bị mất khi viết lại

Bối cảnh: PRD tách "Loại bài" (Mẹo vặt/Gom link) khỏi "Danh mục" do Vinh tạo, cho Sản phẩm dùng lại nhiều bài, và thay lớp AI. Ba thay đổi này đụng vào nhiều thứ đang chạy. NFR-8 chỉ nói chung "giữ sitemap, robots, dữ liệu có cấu trúc".

### 3.1 [Cao] Cấu trúc URL công khai và link cũ
- **Code:** `app/(site)/[category]/page.tsx` phục vụ `/meo-vat`, `/gom-link` (Loại bài hiện đóng vai danh mục); bài ở `/bai-viet/[slug]`; menu (`components/site/nav-links.tsx`) và sitemap sinh từ `CATEGORIES`.
- **Rủi ro:** khi Danh mục mới chiếm route `/[slug]`, hai URL `/meo-vat`, `/gom-link` có thể biến mất; slug Danh mục có thể trùng route hệ thống (`cms`, `bai-viet`, `api`, `styleguide`, trang tìm kiếm). FR-23 chỉ bàn chuyển hướng khi **đổi** slug Danh mục.
- **Đề xuất:** thêm vào FR-23/FR-24: giữ `/bai-viet/[slug]` ổn định; `/meo-vat`, `/gom-link` hoặc vẫn sống (trang theo Loại bài) hoặc chuyển hướng 301; chặn slug Danh mục trùng đường dẫn hệ thống. Thêm: đổi slug **Bài web** cũng phải chuyển hướng 301 (CMS hiện cho sửa slug tự do, link đã chia sẻ sẽ chết).

### 3.2 [Cao] Thuộc tính link affiliate và nhãn công khai
- **Code:** `components/site/product-card.tsx` dùng `target="_blank" rel="sponsored nofollow noopener"`; `AffiliateDisclosure` hiện khi bài có ≥ 1 sản phẩm.
- **PRD:** FR-22 giữ nhãn, nhưng không nhắc `rel="sponsored nofollow"` — thiếu nó Google có thể phạt link trả phí. Banner (FR-25) có link đích cũng cần quy tắc này nếu trỏ sang Shopee.
- **Đề xuất:** thêm vào NFR-8: "Mọi link affiliate trên website (thẻ sản phẩm, Banner) gắn `rel="sponsored nofollow"` và mở tab mới".

### 3.3 [Vừa] SEO trên trang bài: JSON-LD, metadata, canonical
- **Code:** trang bài có JSON-LD `Article` + `BreadcrumbList` (breadcrumb dùng nhãn Loại bài), `canonical`, OpenGraph `article` với `publishedTime/modifiedTime`, ảnh OG; layout có title template `%s | Mẹo Vặt Cuộc Sống`, `lang="vi"`, `locale vi_VN`; trang danh mục có canonical + description; robots chặn `/cms`, `/api/`, `/styleguide`.
- **Rủi ro:** breadcrumb và canonical trang danh mục phải đổi theo Danh mục mới; dễ bị bỏ sót.
- **Đề xuất:** NFR-8 liệt kê cụ thể: JSON-LD Article + Breadcrumb (theo Danh mục), canonical, OG/ảnh OG, title template, robots chặn CMS. Trang Danh mục mới dùng mô tả từ FR-23 làm meta description.

### 3.4 [Vừa] Trải nghiệm đọc trên trang bài và trang chủ
- **Code:** mục lục tự sinh từ h2 (`lib/content.ts`, sticky trên desktop), thời gian đọc, "Bài liên quan" (3 bài cùng Loại bài, `getRelatedPosts`), breadcrumb hiển thị, thẻ (#tag), khối "Sản phẩm trong bài"; trang chủ có bài nổi bật, "Mới cập nhật", băng chuyền "Gom link đồ xinh", danh sách "Mẹo vặt hay".
- **PRD:** không nhắc các khối này; §1 thêm Banner, Xem nhiều nhưng không nói bố cục trang chủ giữ gì. "Bài liên quan" sẽ hỏng/đổi nghĩa khi Danh mục tách khỏi Loại bài.
- **Đề xuất:** thêm một FR "Trang bài viết" (giữ mục lục, thời gian đọc, bài liên quan theo Danh mục, khối sản phẩm, thẻ) và một dòng cho trang chủ (bài nổi bật, mới cập nhật, khối theo Loại bài hoặc Danh mục, + Banner, + Xem nhiều). Để chi tiết cho bước UX.

### 3.5 [Vừa] Chế độ tối, design system và màu theo loại bài
- **Code:** `next-themes` theo hệ thống + `ThemeToggle`; token màu `meo-vat`, `gom-link` (badge, giá); font Be Vietnam Pro có subset tiếng Việt; trang `/styleguide` (ghi chú "xóa trước khi deploy", noindex).
- **Rủi ro:** Danh mục do Vinh tạo không có màu; badge hiện gắn với Loại bài. Dark mode dễ bị quên khi làm Banner, nút tim, nút chia sẻ.
- **Đề xuất:** thêm vào NFR (hoặc chuyển UX): "Website hỗ trợ sáng/tối theo hệ thống; thành phần mới tuân design system hiện có". Quyết định badge hiển thị Loại bài hay Danh mục. Ghi việc xoá `/styleguide` trước deploy vào checklist NFR-10.

### 3.6 [Vừa] Công cụ CMS đang có
- **Code:** `components/cms/post-editor.tsx`: soạn HTML + tab "Xem trước", sửa slug, chấm SEO (vòng điểm `seo-score.tsx`), tab Threads, xuất bản/gỡ xuất bản (`setPostStatus`), xoá bài có xác nhận.
- **PRD:** FR-11 giữ chấm SEO; không nhắc xem trước, gỡ xuất bản (về nháp) hay xoá bài. Gỡ bài nhanh cũng là một biện pháp cho R-2.
- **Đề xuất:** thêm tiêu chí: Vinh có thể xem trước Bài web, chuyển về nháp và xoá bài. Tab Threads hiện tại được thay bởi FR-12/14 — ghi rõ để không thành hai chỗ.

### 3.7 [Vừa] Danh sách host ảnh được phép và nơi lưu upload
- **Code:** `lib/images.ts` chỉ cho ảnh từ `down-vn.img.susercontent.com`, `cf.shopee.vn`, `*.supabase.co` (dùng cho cả `next.config` và kiểm form).
- **Rủi ro:** FR-3 (dán URL ảnh), FR-25 (Banner), FR-1 (upload) sẽ lỗi hiển thị nếu nơi lưu mới (VPS, dịch vụ khác — Câu hỏi mở 1) không nằm trong danh sách; ngược lại nếu mở toang thì mất kiểm soát.
- **Đề xuất:** thêm vào FR-3: URL ảnh dán vào chỉ nhận từ host được phép; thêm host lưu trữ được chọn ở Câu hỏi mở 1.

### 3.8 [Vừa] Sản phẩm hiện gắn chết vào một bài và dữ liệu seed dùng link giả
- **Code:** `Product.postId` với `onDelete: Cascade` — xoá bài là xoá sản phẩm. Seed dùng `https://shopee.vn/search?keyword=…` (không phải link affiliate).
- **Rủi ro:** khi chuyển sang Kho sản phẩm (FR-4), xoá Bài web không được xoá Sản phẩm; dữ liệu seed lên production sẽ có link không ra hoa hồng và trái tiêu chí FR-3.
- **Đề xuất:** FR-4 thêm: "Xoá Bài web không xoá Sản phẩm". Câu hỏi mở 6 mở rộng: chuyển sản phẩm cũ vào Kho, và thay link seed bằng link affiliate thật hoặc xoá bài seed trước khi ra mắt. Ngoài ra FR-3 ("sửa Sản phẩm không đổi bài đã xuất bản") mâu thuẫn với R-2 ("ẩn Sản phẩm áp dụng mọi bài") khi thẻ sản phẩm được render trực tiếp từ bản ghi dùng chung — cần làm rõ trường nào là ảnh chụp, trường nào là dữ liệu sống.

### 3.9 [Thấp] Làm sạch HTML và quy tắc "không link/ảnh trong thân bài"
- **Code:** `lib/sanitize.ts` + prompt chỉ cho h2, h3, p, ul, ol, li, strong, em, blockquote; không link, không ảnh.
- **PRD:** FR-11 có "định dạng website hỗ trợ, làm sạch" — đã phủ. Chỉ lưu ý quan hệ với 1.3 (liên kết nội bộ) và ảnh minh hoạ trong bài (ý gốc dòng 202 gợi ý "Bổ sung ảnh minh họa").

### 3.10 [Thấp] Bộ nhớ đệm và bộ đếm
- **Code:** truy vấn bài dùng `"use cache"` + `cacheLife("days")` + `revalidateTag("posts")` khi xuất bản.
- **Lưu ý:** Lượt xem/tim (FR-26, FR-28) và "Xem nhiều" (FR-27) không được làm mất cache trang bài. NFR-5 đã có ý này; chỉ ghi lại để kiến trúc biết điểm xuất phát.
