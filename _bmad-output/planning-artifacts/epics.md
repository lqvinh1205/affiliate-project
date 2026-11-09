---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md
  - _bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/addendum.md
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/EXPERIENCE.md
  - _bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md
  - docs/quy-dinh.md
---

# affiliate-project - Epic Breakdown

## Overview

Tài liệu này chia yêu cầu của PRD, UX (DESIGN.md + EXPERIENCE.md) và spine kiến trúc của affiliate-project thành epic và story có thể triển khai. Khi mâu thuẫn: `docs/quy-dinh.md` (luật) → spine → docs khác; spine thắng docs.

## Requirements Inventory

### Functional Requirements

FR-1: Lưu Cảm hứng. Người vận hành tạo được Cảm hứng từ một link (TikTok, Pinterest, Shopee, khác), một file video hoặc ảnh tải lên từ thiết bị, kèm ghi chú tuỳ chọn; chỉ cần một link là tạo được, các trường khác để trống. File tải lên giới hạn khoảng 100 MB/file [ASSUMPTION]; nơi lưu do kiến trúc chọn. Danh sách Cảm hứng lọc được theo trạng thái *mới / đã dùng / bỏ qua*; một Cảm hứng dẫn tới 0..n Bộ nội dung.
FR-2: Biến Cảm hứng thành bài. AI tạo Hồ sơ nghiên cứu từ Cảm hứng, gồm từ khoá gợi ý để tìm trên Shopee và dàn ý bài; sau đó Vinh gắn Sản phẩm và tạo Bộ nội dung. Bộ nội dung tạo từ Cảm hứng ghi liên kết tới Cảm hứng đó và Cảm hứng chuyển sang *đã dùng*. Với link video, AI dùng những gì đọc được (tiêu đề, chú thích, ghi chú, khung hình nếu có file); khi không đọc được nội dung video thì hệ thống báo rõ (khả thi đọc video từ link là Câu hỏi mở 3).
FR-3: Tạo và sửa Sản phẩm. Người vận hành tạo/sửa Sản phẩm với tên, Link affiliate, giá tham khảo, ảnh, Danh mục, Dữ liệu thô (văn bản, ảnh, đánh giá dán vào). Ảnh nhập bằng tải lên từ thiết bị hoặc dán URL; URL ảnh chỉ nhận từ host được phép (Shopee và nơi lưu trữ của hệ thống — addendum A4: phải thêm host lưu trữ upload vào `IMAGE_HOSTS` trong `lib/images.ts`). Link affiliate bắt buộc và phải thuộc domain Shopee chính chủ (vd `s.shopee.vn`, `shopee.vn`, `shope.ee`), link khác bị từ chối kèm lý do. Giá hiển thị là "giá tham khảo" kèm ngày cập nhật giá. Sửa Sản phẩm cập nhật ngay mọi Bài web và Trang bio đang dùng nó (độ trễ theo NFR-5), nhưng chữ đã viết trong thân bài không tự đổi; Danh mục do AI gợi ý (FR-11), Vinh đổi được. Addendum A4: link seed `shopee.vn/search?keyword=...` không phải Link affiliate, sẽ bị FR-3 từ chối khi sửa (addendum).
FR-4: Dùng lại Sản phẩm. Gắn được một hoặc nhiều Sản phẩm có sẵn vào một Bài web; một Sản phẩm nằm được trong nhiều Bài web. Tìm Sản phẩm theo tên khi gắn, chỉnh được thứ tự Sản phẩm trong bài. Xoá Bài web không xoá Sản phẩm (thay đổi so với code hiện tại: `Product` đang thuộc riêng một `Post` với `onDelete: Cascade`, phải chuyển sang Kho sản phẩm dùng chung) (addendum).
FR-5: Ẩn Sản phẩm. Ẩn/bỏ ẩn một Sản phẩm bằng một thao tác (khi hàng vi phạm, ngừng bán; giảm thiểu R-2). Sản phẩm bị ẩn biến mất khỏi mọi Bài web và Trang bio trong thời gian của NFR-5 (~1 phút) và Link affiliate của nó không còn xuất hiện trên website. CMS liệt kê các Bài web và Bộ nội dung đang dùng Sản phẩm đó để Vinh tự xử lý bài trên Threads/Facebook.
FR-6: AI tìm thông tin sản phẩm trên web. AI tìm thông tin công khai (công dụng, cách dùng, nhận xét chung) và mỗi ý có link nguồn để Vinh kiểm tra. Không tìm được gì thì báo rõ, không bịa. Addendum A1/A3: endpoint chat completions miễn phí không tự tra web, cần bước search riêng (công cụ tìm web của Claude CLI hoặc API tìm kiếm có free tier) (addendum).
FR-7: AI đọc ảnh sản phẩm. AI dùng ảnh trong Dữ liệu thô để mô tả hình dáng, màu sắc, chất liệu nhìn thấy, chữ trên bao bì; với ảnh có chữ rõ, mô tả trích được tên sản phẩm hoặc dòng chữ chính. Khi nhà cung cấp AI đang dùng không đọc được ảnh thì báo rõ và tiếp tục với dữ liệu chữ. Addendum A1: `gpt-oss-120b` chỉ nhận text, Gemini flash-lite nhận ảnh, lớp `llm.ts` hiện chỉ nhận `content: string` (addendum).
FR-8: Tóm tắt đánh giá. Từ đánh giá Vinh dán vào, AI rút ra ba mục: điểm được khen, điểm bị chê, người dùng phù hợp. Mỗi ý phải dựa trên đánh giá đã dán, không thêm ý ngoài; không có đánh giá thì bỏ qua bước này.
FR-9: Suy ra Người đọc mục tiêu. AI đề xuất 1–3 nhóm Người đọc mục tiêu cho Sản phẩm, mỗi nhóm kèm lý do; Vinh chọn một nhóm hoặc sửa lại.
FR-10: Gợi ý Góc viết. AI đề xuất ít nhất 3 Góc viết, mỗi góc có một câu mở đầu mẫu; Vinh chọn một góc để tạo Bộ nội dung. Với bài Gom link nhiều Sản phẩm, mỗi Sản phẩm có Hồ sơ nghiên cứu riêng và Góc viết được gợi ý từ tất cả hồ sơ đó (§4.3).
FR-11: Gợi ý Danh mục và Loại bài. AI gợi ý Danh mục (chỉ từ các Danh mục có sẵn) cho Sản phẩm và Bài web, và Loại bài (*Mẹo vặt* / *Gom link*) cho Bài web. Giá trị gợi ý được tự điền, Vinh đổi được.
FR-12: Tạo Bộ nội dung trong một lần. Sau khi chọn Góc viết, một nút tạo cả Bài web, Bài Threads, Bài Facebook và Bình luận kèm link, hiện trong một màn hình; Vinh bỏ chọn được nền tảng không cần. Phần nào lỗi thì các phần đã xong không mất và phần lỗi tạo lại riêng được. Hệ thống ghi thời điểm tạo Sản phẩm, tạo Bộ nội dung và copy đầu tiên (để đo SM-3).
FR-13: Tạo Bài web. AI tạo tiêu đề, tóm tắt, nội dung, thẻ, SEO title/description/keywords và ảnh đại diện từ Hồ sơ nghiên cứu, Người đọc mục tiêu và Góc viết. Nội dung chỉ dùng định dạng website hỗ trợ và được làm sạch trước khi lưu; thân bài không chứa link, ảnh hay giá (Sản phẩm hiển thị riêng bên dưới). Mặc định theo Hồ sơ phong cách Website: 600–900 từ, 3–5 mục h2, tiêu đề ≤ 70 ký tự, SEO title ≤ 60, SEO description 140–160, tóm tắt ≤ 200 ký tự, 3–5 thẻ, 3–6 từ khoá. Ảnh đại diện chọn từ ảnh Sản phẩm hoặc tải lên, để trống thì dùng ảnh Sản phẩm đầu tiên; chấm điểm SEO bằng AI (đã có) vẫn dùng được.
FR-14: Tạo Bài Threads riêng. AI tạo Bài Threads (một bài hoặc chuỗi) theo Hồ sơ phong cách Threads, không cần có Bài web trước. Mỗi bài ≤ 500 ký tự (giới hạn Threads); mặc định hồ sơ 4–7 bài, mỗi bài ≤ 250 ký tự, bài đầu là hook. Link affiliate không nằm trong thân bài mà ở Bình luận kèm link; tab Threads hiện có (bài cuối chứa link website, `components/cms/post-editor.tsx`) được thay bằng FR-14 và FR-16 (addendum).
FR-15: Tạo Bài Facebook riêng. AI tạo Bài Facebook theo Hồ sơ phong cách Facebook, không cần có Bài web trước. Thân bài không chứa link, link nằm trong Bình luận kèm link. Mặc định một bài, khoảng 80–250 từ [ASSUMPTION], xuống dòng dễ đọc trên điện thoại.
FR-16: Chuyển Bài web thành Bài mạng xã hội. Từ một Bài web có sẵn, tạo được Bài Threads và/hoặc Bài Facebook, vẫn theo Hồ sơ phong cách từng nền tảng và thuộc cùng Bộ nội dung với Bài web.
FR-17: Soạn Bình luận kèm link. Với mỗi Bài mạng xã hội, AI soạn Bình luận kèm link chứa Link affiliate của (các) Sản phẩm, dẫn thẳng sang Shopee; link là nguyên Link affiliate, không qua link của website (FR-25).
FR-18: Quản lý Hồ sơ phong cách. Xem/sửa Hồ sơ phong cách Website, Threads, Facebook: giọng văn, độ dài, emoji, điều cấm, nội quy. Khởi tạo sẵn giọng thương hiệu (gần gũi, dí dỏm vừa phải kiểu Gen-Z, rõ ràng, hữu ích, không sến, không phóng đại, không giật tít sai sự thật, tiếng Việt có dấu chuẩn) và giá trị mặc định như FR-13/14/15; addendum A4: quy chuẩn bài web và giọng thương hiệu hiện nằm trong prompt `lib/ai.ts` được chuyển thành giá trị khởi tạo (addendum). Thay đổi chỉ áp dụng cho lần tạo sau, không sửa nội dung đã tạo. Hồ sơ Threads và Facebook có ô "câu công khai" tuỳ chọn, mặc định trống; khi điền, AI chèn câu này vào Bình luận kèm link.
FR-19: Copy nhanh để đăng tay. Mỗi Bài mạng xã hội có nút copy cho từng bài trong chuỗi và cho Bình luận kèm link, dùng được bằng một chạm trên điện thoại.
FR-20: Đánh dấu đã đăng. Đánh dấu Bài mạng xã hội *đã đăng* (từ *chưa đăng*), kèm link bài đăng tuỳ chọn; hệ thống ghi thời điểm đánh dấu (đo SM-2). Trên một Sản phẩm, Vinh thấy nó đã lên nền tảng nào.
FR-21: Tạo lại có định hướng. Với mọi Gợi ý AI, yêu cầu tạo lại được kèm chỉ dẫn ngắn (vd "ngắn hơn", "vui hơn", "bỏ phần giá").
FR-22: Duyệt Gợi ý AI. Mỗi phần AI tạo (Hồ sơ nghiên cứu, Bài web, Bài Threads, Bài Facebook, Bình luận kèm link, Danh mục gợi ý) là một Gợi ý AI duyệt riêng, trạng thái *chờ duyệt / đã duyệt / đã từ chối*; mới tạo là *chờ duyệt*. Sửa rồi Duyệt hoặc từ chối được; từ chối thì gợi ý bị bỏ và tạo lại được (FR-21); sửa sau khi đã Duyệt không cần Duyệt lại; nội dung Vinh tự viết không cần Duyệt. Không xuất bản được Bài web khi phần AI của nó chưa Duyệt; Bài mạng xã hội chưa Duyệt vẫn copy được nhưng có cảnh báo rõ [ASSUMPTION].
FR-23: Cảnh báo rủi ro. AI gắn Cảnh báo rủi ro cho câu: khẳng định công dụng y tế/mỹ phẩm/thực phẩm; cam kết tuyệt đối ("100%", "chắc chắn"); so sánh hạ thấp đối thủ; giá cụ thể trong thân bài; điểm có thể vi phạm nội quy Threads/Facebook. Mỗi cảnh báo chỉ rõ câu và lý do; cảnh báo không chặn Duyệt. Có bộ câu mẫu kiểm thử (≥ 20 câu, gồm câu vi phạm và câu bình thường): bắt ≥ 90% câu vi phạm, báo nhầm ≤ 20% câu bình thường [ASSUMPTION].
FR-24: Nhãn công khai affiliate trên website. Mọi Bài web có ít nhất một Sản phẩm tự động hiển thị Nhãn công khai affiliate ở vị trí dễ thấy (giữ hành vi đã có); Trang bio cũng hiển thị nhãn. Bài Threads/Facebook không tự chèn nhãn (quyết định của Vinh, xem R-1).
FR-25: Quy tắc link affiliate. Mọi Link affiliate trên website (thẻ Sản phẩm, Trang bio, Banner trỏ sang Shopee) hiển thị nguyên link Shopee chính chủ, không đi qua đường chuyển hướng của website (vd `/go/...`, vì có thể vi phạm điều khoản Shopee, R-7), có `rel="sponsored nofollow"` và mở tab mới.
FR-26: Trang bài viết. Trang Bài web hiển thị mục lục tự sinh từ h2, thời gian đọc, breadcrumb theo Danh mục, thẻ, khối Sản phẩm trong bài, Nhãn công khai affiliate, và ít nhất 3 bài liên quan cùng Danh mục (nếu có đủ).
FR-27: Quản lý Bài web trong CMS. Xem trước, xuất bản, chuyển về nháp, xoá bài (có xác nhận); trạng thái *nháp / đã xuất bản*. Đổi slug bài đã xuất bản thì đường dẫn cũ chuyển hướng 301 sang mới.
FR-28: Quản lý Danh mục. Tạo, sửa (tên, đường dẫn, mô tả, thứ tự hiển thị), xoá Danh mục; Danh mục dùng chung cho Bài web và Sản phẩm, thay hai mục cố định hiện nay (addendum A4: enum `MEO_VAT | GOM_LINK` giữ làm Loại bài, Danh mục là bảng mới, badge màu gắn Loại bài) (addendum). Không xoá được Danh mục còn Bài web hoặc Sản phẩm (phải chuyển trước); đổi đường dẫn thì cũ chuyển hướng 301; đường dẫn không trùng đường dẫn hệ thống (vd `cms`, `bai-viet`, `bio`, `tim-kiem`, `api`). `/meo-vat` và `/gom-link` vẫn hoạt động, giữ làm trang theo Loại bài [ASSUMPTION]. Danh mục khởi tạo đề xuất 8 mục: Nhà bếp, Nhà cửa & Decor, Giặt giũ & Tủ đồ, Làm đẹp, Thời trang, Cây cảnh, Học tập & Làm việc, Du lịch (Câu hỏi mở 5).
FR-29: Trang Danh mục public. Mỗi Danh mục có trang liệt kê Bài web đã xuất bản, có phân trang, xuất hiện trong menu và sitemap, dùng mô tả Danh mục làm meta description.
FR-30: Trang bio public. Hiển thị phần giới thiệu ngắn, Nhãn công khai affiliate luôn ở đầu trang (ghi rõ trang có quảng cáo, không bị ẩn), liên kết về trang chủ, và danh sách Sản phẩm đang *hiện* nhóm theo Danh mục. Mỗi Sản phẩm có ảnh, tên, giá tham khảo, nút tới Link affiliate (theo FR-25); lọc được theo Danh mục, Sản phẩm ghim nổi bật lên đầu. Đường dẫn ngắn `/bio` [ASSUMPTION]; không có liên kết tuỳ chỉnh nào khác ngoài liên kết về trang chủ.
FR-31: Quản lý Trang bio. Sửa phần giới thiệu và câu chữ Nhãn công khai affiliate (không tắt được), chọn Sản phẩm nào hiện, ghim Sản phẩm nổi bật và sắp thứ tự. Sản phẩm mới tạo mặc định hiện trên Trang bio [ASSUMPTION]; Sản phẩm bị ẩn (FR-5) không bao giờ hiện.
FR-32: Quản lý Banner. Tạo Banner (ảnh, tiêu đề, mô tả ngắn, link đích, thứ tự), bật/tắt, đặt thời gian hiển thị tuỳ chọn (vd dịp 11.11); website chỉ hiện Banner đang bật và trong thời gian hiển thị. Không vỡ bố cục ở màn hình rộng 360px; CMS hiển thị tỉ lệ ảnh khuyến nghị. Link đích sang Shopee tuân FR-25.
FR-33: Đếm Lượt xem. Ghi nhận Lượt xem mỗi Bài web đã xuất bản; không đếm Người vận hành khi đang đăng nhập CMS và không đếm bot phổ biến [ASSUMPTION]; không lưu dữ liệu định danh người đọc.
FR-34: Bài xem nhiều. Trang chủ có khu "Xem nhiều" hiển thị Bài web nhiều Lượt xem nhất, tính trong 30 ngày gần nhất [ASSUMPTION]. Giữ các khối trang chủ hiện có (bài nổi bật, mới cập nhật, khối theo Loại bài); bố cục do bước UX quyết định.
FR-35: Thả tim. Người đọc thả tim và bỏ tim Bài web không cần đăng nhập; mỗi trình duyệt chỉ tính một tim mỗi bài; giới hạn ≤ 30 lần thả tim/phút từ cùng một nguồn [ASSUMPTION].
FR-36: Tìm kiếm. Người đọc tìm Bài web đã xuất bản theo từ khoá; khớp cả khi gõ không dấu (vd "noi chien" tìm được "nồi chiên").
FR-37: Chia sẻ. Mỗi Bài web có nút chia sẻ lên Facebook, Threads và nút sao chép link; trên điện thoại dùng được chia sẻ gốc của hệ điều hành.
FR-38: Thống kê trong CMS. Danh sách bài trong CMS hiện Lượt xem và Lượt tim từng Bài web, sắp xếp được theo hai chỉ số này.
FR-39: Nhập Bài web từ URL (thêm 2026-11-09). Ở màn Tạo Bài web, dán URL bài bên ngoài → AI đọc trang, điền sẵn tiêu đề, tóm tắt, thân bài vào form bài đầy đủ (chưa lưu); chỉ tạo Nháp khi bấm Lưu. Thân bài làm sạch, không link/ảnh; link ảnh liệt kê riêng, không tự tải; ghi đè cần xác nhận; không đọc được trang thì báo rõ.
FR-40: AI chỉnh sửa trong trình soạn (thêm 2026-11-09). "AI chỉnh sửa" + chỉ dẫn tuỳ chọn viết lại tiêu đề, tóm tắt, thân bài đang có trong form theo Hồ sơ phong cách Website, kèm Cảnh báo rủi ro; điền form chưa lưu, hoàn tác được. Có ở form nhập từ URL và trình soạn bài đã có. FR-39/40 là ngoại lệ của FR-22 (không tạo Gợi ý AI).

### NonFunctional Requirements

NFR-1: Nhà cung cấp AI thay được. Mọi tính năng AI gọi qua một lớp chung; đổi nhà cung cấp/model không cần sửa từng tính năng. Không dùng OpenAI. Lớp AI phải hỗ trợ đọc ảnh (FR-7) và tìm web (FR-6); phương án cụ thể do kiến trúc chọn trong giới hạn NFR-9. Addendum A1/A3: bỏ OpenAI SDK; ứng viên là Claude CLI headless (`claude -p`, theo gói thuê bao sẵn có, cần kiểm điều khoản) và/hoặc lớp `llm.ts` đa nhà miễn phí (Groq, Gemini, Cerebras, OpenRouter qua giao thức OpenAI-compatible, 2 profile `fast`/`quality`, `jsonMode`, `parseJsonFromAI`); có thể kết hợp; Claude API trả phí đã bị loại. Mất structured output phía server nên phải validate zod sau `parseJsonFromAI` và thử lại (addendum).
NFR-2: Chịu lỗi AI. Khi một nhà cung cấp lỗi hoặc hết hạn mức, tự chuyển sang nhà khác nếu có; khi tất cả lỗi, Vinh nhận thông báo rõ bằng tiếng Việt và dữ liệu đã nhập không mất. Addendum A1: `llm.ts` tự chuyển nhà khi lỗi/timeout/rate-limit, cooldown khoá trong bộ nhớ tiến trình (60s TPM, 6h hết quota, 2m treo) — hợp VPS đơn, có thể bị reset ở dev/serverless (addendum).
NFR-3: Phản hồi khi AI chạy lâu. Giao diện hiện trạng thái đang xử lý, không treo; mỗi thao tác AI hoàn tất hoặc báo lỗi trong tối đa 90 giây [ASSUMPTION]; rời màn hình rồi quay lại vẫn thấy kết quả. (Addendum A1: `LLM_TIMEOUT_MS` mặc định 55s; Claude CLI chậm "vài chục giây".)
NFR-4: CMS ưu tiên điện thoại. Toàn bộ UJ-1 và UJ-2 làm được trên điện thoại.
NFR-5: Hiệu năng và độ tươi website. Trang bài viết, trang chủ, Trang bio đạt Core Web Vitals mức "Tốt" trên di động. Lượt xem, Lượt tim, Banner không làm chậm hiển thị nội dung chính. Thay đổi khi xuất bản, sửa, gỡ bài, hoặc sửa, ẩn Sản phẩm hiện trên website trong vòng khoảng 1 phút, không cần deploy lại.
NFR-6: Bảo mật CMS. Chỉ Người vận hành truy cập được CMS và thao tác ghi; mọi thao tác ghi kiểm tra quyền phía server.
NFR-7: Quyền riêng tư người đọc. Không thu thập dữ liệu cá nhân người đọc; Lượt xem và Lượt tim chỉ dùng định danh ẩn danh tối thiểu để chống trùng.
NFR-8: SEO. Giữ và mở rộng nền SEO: sitemap (gồm Danh mục), robots chặn CMS, JSON-LD `Article` và `BreadcrumbList` (theo Danh mục), canonical, OpenGraph kèm ảnh, title template, `lang="vi"`. Trang Danh mục có metadata riêng; trang tìm kiếm noindex [ASSUMPTION]; Link affiliate theo FR-25.
NFR-9: Chi phí vận hành. Ngân sách giai đoạn này 0đ/tháng cho AI và hạ tầng ngoài những gì Vinh đã có; chỉ chọn giải pháp miễn phí hoặc gói thuê bao Vinh đang trả sẵn. (Addendum A3: hạn mức free Groq ~500 req/ngày, Gemini 1500 req/ngày, nhiều khả năng đủ cho ~3 sản phẩm/ngày.)
NFR-10: Triển khai. Chạy được trên một VPS đơn khi deploy (hiện chưa deploy). Trước khi deploy phải xoá trang `/styleguide`. 10 bài mẫu được giữ làm dữ liệu; link của chúng là link tìm kiếm Shopee, không tạo hoa hồng, Vinh thay bằng Link affiliate qua CMS khi cần.
NFR-11: Giao diện nhất quán. Website hỗ trợ sáng/tối theo hệ thống (đang có); thành phần mới (Banner, tim, chia sẻ, Trang bio) theo design system hiện có và hiển thị đúng ở cả hai chế độ.

### Additional Requirements

Brownfield: không có starter template mới; Epic 1 là epic nền theo AD-17 (4 bước, đúng thứ tự; bước 3 migration nền là đúng một story).

Giai đoạn (PRD §8): GĐ1 = NFR-1, NFR-2, FR-3..FR-31 (gồm Trang bio), FR-33, FR-38. GĐ1.5 = FR-1, FR-2, FR-32, FR-34..FR-37, FR-39, FR-40. GĐ2 = bình luận website và các mục ở "Ngoài phạm vi".

#### Quyết định khi chia story (Vinh 2026-11-05, đã ghi vào spine AD-17)

- Migration nền (AD-17 bước 3) làm đúng phần spine nêu, cộng thêm `Post.categoryId` và `Product.categoryId`, rồi bỏ `Product.postId` sau khi chuyển dữ liệu. Các cột/bảng còn lại (`Product.hidden`, `priceText`/`priceUpdatedAt`, `Post.searchText`, `PostSlugRedirect`, `CategorySlugRedirect`) do story của FR tương ứng thêm, theo lượt (AD-15).
- AD-17 bước 1: việc kiểm 308 cho slug cũ chuyển sang story đổi slug (FR-27). Đổi matcher `proxy.ts` (AD-24) làm ngay ở bước 1, sau đó `curl -I` kiểm `/cms` và `/cms.rsc` trả 401.
- `platform/format` và `platform/site` dựng ở AD-17 bước 2. `platform/ai` dựng trong story AI đầu tiên, sau khi chốt nhà cung cấp. `platform/storage` dựng trong story upload đầu tiên, sau khi chốt backend lưu file.
- Đã chốt trong spine, không mở lại: Danh mục gợi ý là `Suggestion` riêng, phải Duyệt (AD-19). Hạn 90 giây tính cho mỗi lần gọi AI (AD-18).

#### Ngoài phạm vi / hoãn (PRD)

- Không tự đăng lên Threads hay Facebook; Vinh đăng tay (tự đăng qua Threads API: xem lại ở GĐ2).
- Không cào dữ liệu Shopee (tạm hoãn, xem lại GĐ2); không tự tạo hay chuyển đổi Link affiliate — Vinh nhập tay.
- Không theo dõi doanh thu, không gắn `sub_id`, không đếm click ra Shopee; chỉ đếm Lượt xem Bài web. Vinh tự đối chiếu trên dashboard Shopee Affiliate (xem lại GĐ2).
- Không chuyển hướng link affiliate qua domain của website (FR-25).
- Không chèn link nội bộ vào thân bài; liên kết nội bộ đi qua bài liên quan, breadcrumb, Danh mục.
- Không có tài khoản người đọc, không newsletter (xem lại GĐ2), không bình luận trên website (GĐ2: có duyệt, AI lọc spam — tạm hoãn).
- Không hỗ trợ nền tảng khác ngoài Website, Threads, Facebook (không TikTok, Pinterest, Zalo); TikTok/Pinterest chỉ là nguồn Cảm hứng.
- Không có nhiều người vận hành, không phân quyền; không cộng tác viên/biên tập viên khác.
- Không dùng OpenAI, không dùng dịch vụ AI trả phí (NFR-9; Claude API trả theo lượng đã bị loại — addendum A3).
- Bài Threads/Facebook không tự chèn nhãn quảng cáo (Vinh chấp nhận rủi ro R-1).
- Hoãn sang GĐ1.5: Kho cảm hứng (FR-1, FR-2), Banner (FR-32), Xem nhiều/Thả tim/Tìm kiếm/Chia sẻ (FR-34..FR-37).

#### Epic nền (AD-17)

**Brownfield, không có starter template mới.** Spine chọn modular monolith trên app Next.js hiện có; AD-17 là "di chuyển dần" code hiện tại (`lib/`, `components/site|cms/`, `app/cms/actions.ts`) sang `modules/` + `platform/`. Spine không nhắc tới việc khởi tạo dự án hay starter template nào. Stack giữ nguyên các major đã ghim; thêm mới: react-hook-form 7.91.0, @hookform/resolvers 7.0.1, server-only 0.0.1, vitest 5.1.0, vite 8.3.5 (peer); nâng @types/node ^22; gỡ openai 7.47.0.

Epic đầu tiên, làm **đúng thứ tự**, trước mọi module nghiệp vụ mới:

##### Bước 1 — Kiểm chứng hành vi Next.js
- Kiểm chứng `[NO-23]` (`updateTag` có làm mới trang đã prerender, ví dụ `/bai-viet/[slug]`, `sitemap.xml`) bằng `npm run build && npm start`.
- Kiểm chứng `[NO-24]` (Server Action công khai gọi từ trang `ensureStatic = "navigation"`) bằng `npm run build && npm start`.
- `curl -I`: slug không tồn tại trả **404**; slug cũ trả **308** (AD-12, AD-20).
- Sau khi đổi matcher `proxy.ts` (AD-24: `["/cms", "/cms/((?!upload$).*)", "/api/:path*"]`), `curl -I` không kèm header tới `/cms` và `/cms.rsc` trả **401**.

##### Bước 2 — Dựng `platform/`, khung test, ESLint
- Dựng `platform/`: `db`, `auth/run` (basic-auth, require-admin, run), `errors`, `validation`, `html`, `slug`, `images`.
- Dựng khung test (Vitest; alias `server-only` sang file rỗng; resolve `@/` theo `tsconfig` — AD-16).
- Sửa `[NO-01]`..`[NO-06]` và `[NO-11]`:
  - NO-01: `sanitize` còn cho `a`, `img` trong thân bài.
  - NO-02: `sanitizePostHtml` ghi đè `rel` thành `noopener`; link `//host` và ảnh host bất kỳ lọt qua.
  - NO-03: `isAllowedImageUrl` nhận `//evil.com/x.png`.
  - NO-04: `*.supabase.co` lệch giữa validate form và `remotePatterns`.
  - NO-05: `affiliateUrl` chưa giới hạn domain Shopee.
  - NO-06: bài nháp AI trong `createPost` không qua `postInputSchema`.
  - NO-11: `require-admin` ném lỗi tiếng Anh; `findUniqueOrThrow` lọt lỗi Prisma tiếng Anh.
- Đổi alias `components.json`: `lib` → `@/components/ui/lib`, `utils` → `@/components/ui/lib/utils` (shadcn ghi `cn` theo alias `lib`), `hooks` → `@/components/ui/hooks`. Hook tự viết dùng chung đặt ở `components/shared/hooks/` (`components/ui` không import `components/shared`).
- Chuyển `/styleguide` vào `app/cms/styleguide` (noindex).
- ESLint `no-restricted-imports` áp cho `modules/**`, `platform/**`, `components/shared/**`, `app/**`: chặn import trái AD-2 (gồm **tầng module** T0..T4) và chặn import `@/lib/*`, `@/components/site|cms/*`.
- Bật `import/no-cycle` (`eslint-plugin-import` có sẵn qua `eslint-config-next`).
- File cũ miễn qua danh sách `ignores` **tường minh**; mỗi lần chuyển một file thì bỏ nó khỏi danh sách.
- Đặt `maxDuration = 120` ở route kích hoạt AI (AD-18); hiện `app/cms/layout.tsx` là 60.
- Vinh duyệt `[QU-26]`–`[QU-28]` trong `docs/quy-uoc-code.md` (thứ tự trong file, chữ ký hàm theo vai trò, khi nào tách hàm/file).

##### Bước 3 — Migration nền (ĐÚNG MỘT story)
- Tách `prisma/schema/` (`_base` + `<module>.prisma`); generator `output` đổi thành `../../generated/prisma`.
- Đổi enum `Category` thành `PostType` (`MEO_VAT`, `GOM_LINK`).
- Tạo model `Category` (chủ: `categories`).
- Tạo model `PostProduct` (bảng nối tường minh, chủ: `posts`).
- Chuyển dữ liệu `Product.postId` sang `PostProduct` (hiện `Product.postId` là `String` bắt buộc, `onDelete: Cascade`).
- Seed tối thiểu **một Danh mục và một Bài web** (để `generateStaticParams` không trả mảng rỗng — AD-7).

Cột/bảng liên quan trong bảng *Chủ sở hữu bảng* mà spine **không** nói rõ là thuộc migration nền hay story sau (xem mục mâu thuẫn): `Post.categoryId`, `Post.postType` (là đổi tên từ `category`), `Post.searchText`, `PostSlugRedirect`, `CategorySlugRedirect`, `Product.categoryId`, `Product.hidden`, `Product.priceText`, `Product.priceUpdatedAt`.

##### Bước 4 — Cập nhật tài liệu
- Cập nhật `docs/` theo spine: `kien-truc-codebase.md`, `quy-uoc-code.md`, `nen-tang-ky-thuat/*`, `cong-thuc/*`, `kiem-chung.md` (thêm Vitest).
- Sửa `[QD-14]` (mẫu `AffiliateLink` thay `components/site/product-card.tsx`), `[QD-20]` (ghi thêm route upload là ngoại lệ thứ ba), `[PR-15]` (thêm trường vào model có sẵn), `[PR-16]` (thêm model mới + migration).
- Ghi Supabase là **giả định** (Deferred).
- Làm mới `AGENTS.md` qua `bmad-project-context`.

##### Luật sau epic nền (áp cho mọi story)
- Story chạm file cũ (`lib/*`, `components/site|cms/*`, `app/cms/actions.ts`) thì chuyển file đó về vị trí mới trong cùng story, cập nhật mọi import; không tạo file mới ở vị trí cũ. Vị trí mới theo `docs/cong-thuc/chuyen-code-cu.md`.
- `app/cms/actions.ts` tách theo action bị chạm, chuyển action cùng hàm phụ: `savePost`, `setPostStatus`, `deletePost` → `posts`; `createPost` (có AI), `runThreads` → `suggestions` với kind `WEB_POST`, `THREADS_POST`; `runSeoCheck` → `posts.checkPostSeo`. Xoá file khi rỗng.

#### Yêu cầu kỹ thuật bổ sung

- **AD-1** Code nghiệp vụ ở `modules/<miền>/`, hạ tầng `platform/`, định tuyến `app/`; không tạo lại `lib/`, `components/site/`, `components/cms/`.
- **AD-2** Hướng phụ thuộc `app → modules → platform`, `modules → components/{ui,shared}`; `platform/`, `components/` không import `modules/`/`app/`; `app/` không import `platform/db` hay `service.ts`. Module A chỉ import từ B: `queries.ts`, `cms-queries.ts`, `types.ts`, `constants.ts`, `tags.ts`, `components/`. Chỉ import module tầng thấp hơn, cùng tầng không import nhau, không vòng.
- **AD-2 (đọc chéo)** Query đọc bảng tầng thấp hơn qua quan hệ Prisma (chỉ đọc), dùng lại điều kiện/select của module đó (`visibleProductWhere`). Query chạm nhiều module nằm ở module tầng cao nhất (Danh mục có bài → `posts`; xếp theo Lượt xem → `engagement`; Sản phẩm dùng ở bài nào → `posts`). Hai module cùng tầng: Screen gọi từng query rồi ghép.
- **AD-3** Danh sách module đóng: `posts`, `products`, `categories`, `content-sets`, `suggestions`, `research`, `style-profiles`, `inspirations`, `banners`, `bio`, `engagement`. Thêm/đổi phải sửa spine trước.
- **AD-4** Mỗi bảng một chủ; model nằm ở `prisma/schema/<module chủ>.prisma`; chỉ `service.ts` của chủ ghi. Module khác chỉ thêm trường quan hệ ngược, không thêm cột. Bảng nối luôn tường minh.
- **AD-5** Hợp đồng file module: `schema.ts` (Zod), `types.ts`, `constants.ts?`, `tags.ts` (`<MIỀN>_TAG = "<tên module>"`), `queries.ts` (public, cache, không `headers/cookies/requireAdmin`), `cms-queries.ts` (không cache), `service.ts` (ghi, nhận input đã validate + `tx?`; không `"use server"`/`updateTag`/`requireAdmin`/validate), `actions.ts` (không gọi Prisma trực tiếp), `prompts/*.prompt.ts`, `components/`. Không `index.ts` barrel.
- **AD-6** Ghi CMS: `run()` (gồm `requireAdmin()`) → `schema.safeParse` → `service` → `updateTag(tag mọi module bị đổi)`. Đúng ba ngoại lệ: `engagement/actions.ts` (ghi Lượt xem/Lượt tim, đọc số tim; validate, giới hạn tần suất, không `updateTag`, không lưu định danh), `posts.searchPosts` (chỉ đọc, giới hạn tần suất, chỉ bài đã xuất bản), `app/cms/upload/route.ts`. Không endpoint công khai dưới `/api`.
- **AD-7 (cache)** Trang `(site)` giữ `ensureStatic = "navigation"`, chỉ đọc qua `queries.ts` (`"use cache"` + `cacheLife` + `cacheTag`); `cacheLife` stale ≥ 30 s, revalidate > 0, expire ≥ 5 phút. Query gắn tag **mọi** module có bảng nó đọc/lọc/đếm/sắp xếp (ví dụ `getPostBySlug` gắn `posts` + `products`).
- **AD-7 (Sản phẩm ẩn)** Mọi query trả Sản phẩm public dùng `visibleProductWhere` + `publicProductSelect` từ `products/queries.ts`, kể cả ảnh đại diện fallback.
- **AD-7 (động)** Không đọc `searchParams`/`headers()`/`cookies()` server-side trong `(site)`; dữ liệu theo request lấy phía client qua action công khai. Phân trang bằng đoạn tĩnh `/[danh-muc]/trang/[n]`, `/meo-vat/trang/[n]`, `/gom-link/trang/[n]`; `generateStaticParams` không trả mảng rỗng (giữ chỗ `n = "2"` → `notFound()`); `n = 1` → `permanentRedirect` về trang gốc. `PAGE_SIZE` site ở `posts/constants.ts`.
- **AD-7 (Banner, múi giờ)** Query `banners` lấy "now" bên trong hàm `"use cache"` (không nhận `now` làm tham số), revalidate ≤ 60 s; không lọc lịch phía client; trạng thái lịch tính bằng một hàm duy nhất của `banners` cho cả public và CMS; giờ `Asia/Ho_Chi_Minh`.
- **AD-8** `service.ts`, `queries.ts`, `cms-queries.ts`, `platform/db|ai|storage` mở đầu `import "server-only"`. Client component là `*.client.tsx`, props serialize được (`Date` → ISO), chỉ gọi Server Action.
- **AD-9** Mọi đầu ra AI là `Suggestion` (`kind`, `status`, `payload` Zod theo kind, `riskWarnings`, `promptId`, `promptVersion`, `editedBeforeApproval`, `parentSuggestionId`, `sources?`, `skipped?`), gắn đúng một trong `productId`/`contentSetId`/`inspirationId` (CHECK SQL). `suggestions/actions.ts` là điểm điều phối duy nhất cho tạo và Duyệt; ngoại lệ AD-2 duy nhất, chỉ import `service.ts` + `prompts/` của `posts`, `products`, `content-sets`, `research`. Duyệt trong một transaction rồi `updateTag`. Nội dung Vinh tự viết không cần `Suggestion`. Ngoại lệ: `posts.checkPostSeo` (qua `run()`, gọi `platform/ai`, không lưu, không Duyệt).
- **AD-10** Chỉ `platform/ai` gọi nhà cung cấp; không OpenAI. `ask({ prompt, input, images?, videoUrl?, webSearch? }) → { data, sources?, skipped }`; parse lỗi thử lại đúng một lần kèm lỗi Zod, vẫn lỗi → `UserError` tiếng Việt; thiếu năng lực ghi vào `skipped`, không ném. Prompt theo `PromptDef { id, version, profile, output, system(style), user(input) }` ở `modules/<miền>/prompts/`; giọng văn/độ dài/câu công khai từ Hồ sơ phong cách; quy tắc chung ở `platform/ai/rules.ts`. Không gọi AI trong transaction; có chế độ giả lập cho test.
- **AD-11** Component thực thể và form `<x>-form.client.tsx` ở `modules/<miền>/components/`; `components/ui` chỉ qua shadcn CLI (dependency npm mới → hỏi); `components/shared` cho component không nghiệp vụ (`UploadField`, `ConfirmDialog`, `UnsavedChangesGuard`); `app/cms/_components/`, `app/(site)/_components/`, `_components/` cạnh route. Xem trước CMS dùng đúng component public. Mọi link Shopee qua `AffiliateLink` (nguyên link, `target="_blank"`, `rel="sponsored nofollow noopener"`); nhãn `AffiliateDisclosure`. Thiếu component → `[COMPONENT-UNKNOWN]` và hỏi.
- **AD-12** `page.tsx` chỉ metadata + `<Suspense>` + một `<…Screen>`. Trang `(site)` có tham số: `page.tsx` gọi query cache, tra lịch sử slug, `notFound()`/`permanentRedirect()` **trước** `<Suspense>`. CMS: Screen gọi `notFound()` trong `<Suspense>` (chấp nhận 200), được đọc `searchParams`; đọc tương tác CMS qua URL + `cms-queries`, không action đọc. Fallback `<x>-skeleton.tsx`, không `loading.tsx`. `error.tsx` ở `(site)`, `cms`, `global-error.tsx`; ba `not-found.tsx` (`(site)`, `cms`, gốc), hai file site dùng chung `NotFoundScreen`. Form RHF không reset theo props. Trạng thái rỗng/lỗi theo `EXPERIENCE.md`.
- **AD-13** Action trả `Result<T>` qua `run()`; lỗi cho người dùng là `UserError` (`platform/errors.ts`) tiếng Việt; lỗi bất ngờ `console.error` + "Có lỗi xảy ra, thử lại sau". Query không ném lỗi nghiệp vụ, trả `null`.
- **AD-14** Schema ghép từ `platform/validation/fields.ts` (`requiredText`, `optionalText`, `imageUrl`, `shopeeAffiliateUrl`, `slugField`); `@db.VarChar(n)` bằng giới hạn trong `constants.ts`. Link affiliate chỉ domain Shopee chính chủ; host ảnh chỉ ở `platform/images.ts`. Form: RHF + `zodResolver` cùng `schema.ts`, `field` shadcn + `Controller`; form một trường được dùng `useTransition` + `Result`. Lỗi validate tại trường phía client; `UserError` server qua toast.
- **AD-15** Theo `[PR-07]`; mọi quan hệ ghi rõ `onDelete` (Cascade/Restrict/SetNull); Sản phẩm đang dùng chỉ `hidden`, không xoá cứng. Enum cho tập cố định code rẽ nhánh, bảng cho tập Vinh quản lý. `Json` chỉ khi có Zod ở module chủ, luôn `parse`. Migration tên `verb_object`, `--create-only` rồi đọc SQL, không sửa migration đã áp, **mỗi lần chỉ một story tạo migration**; CHECK/partial unique index viết tay kèm comment. Bảng ngoài danh sách chủ → `[SCHEMA-UNKNOWN]` và hỏi; cột mới cho một FR ghi trong story.
- **AD-16** Vitest; unit test bắt buộc cho `platform/` và `schema.ts`; test tích hợp `service.ts` trên Postgres test cục bộ, gồm "ẩn Sản phẩm biến mất khỏi mọi query public". Test `*.test.ts` cạnh nguồn, tên tiếng Việt, viết theo PRD/spine. Không gọi AI thật; độ chính xác Cảnh báo rủi ro (FR-23) đo bằng script chạy tay ngoài suite. Không e2e.
- **AD-17** Xem mục Epic nền.
- **AD-18** `status`: `GENERATING` → `PENDING`|`FAILED`; `PENDING` → `APPROVED`|`REJECTED`|`SUPERSEDED`. Action tạo ghi `GENERATING`, trả ngay, gọi AI trong `after()`. Mỗi phần FR-12 (bài web, Threads, Facebook, bình luận) là một `Suggestion` + một lần gọi AI riêng, chạy song song độc lập. Hạn 90 s mỗi lần gọi (trong `platform/ai`); `maxDuration = 120` ở route kích hoạt; `GENERATING` > 120 s coi là `FAILED` (`cms-queries` trả `FAILED`, action tạo lại đánh dấu `FAILED` trong cùng transaction). Một `generating-poller.client.tsx` mỗi màn, `router.refresh()` mỗi 3 s, dừng sau 120 s; không action đọc. `after()` không `updateTag`; nếu buộc phải thì `revalidateTag(tag, "max")`.
- **AD-19** Duyệt upsert vào đích theo `kind`: `RESEARCH` → `ResearchProfile` (`productId`/`inspirationId`); `WEB_POST` → `Post` (khoá `ContentSet.postId`, tạo khi chưa có); `THREADS_POST`/`FACEBOOK_POST` → `SocialPost` (`@@unique([contentSetId, platform])`); `LINK_COMMENT` → `SocialPost.linkComment`; `PRODUCT_CATEGORY` → `Product.categoryId`. Mỗi khoá đích tối đa một `GENERATING`/`PENDING` (partial unique index); tạo lại → cũ `SUPERSEDED`, mới mang `parentSuggestionId`.
- **AD-19 (chi tiết)** Payload Zod = `output` của `PromptDef` ở module chủ đích; lựa chọn (Góc viết, Người đọc) theo `id` ổn định. Sau Duyệt `payload` bất biến, sửa đích bằng component của module chủ. Nghiên cứu Sản phẩm: một lần gọi → hai `Suggestion` (`RESEARCH`, `PRODUCT_CATEGORY`), Duyệt độc lập; `PRODUCT_CATEGORY` không tạo lại riêng. Duyệt `LINK_COMMENT` cần bài cùng nền tảng đã Duyệt, không thì `UserError`. Duyệt `WEB_POST` chỉ vào `Post` còn `DRAFT`. Khoá nút Xuất bản (FR-22): Screen lấy trạng thái từ `suggestions/cms-queries` truyền props; `posts` không import `suggestions`.
- **AD-20** `platform/slug.ts` có `RESERVED_ROOT_SLUGS` (`cms`, `api`, `bai-viet`, `bio`, `tim-kiem`, `meo-vat`, `gom-link`, `trang` + mọi thư mục gốc `app/(site)`) và `slugify`; test so danh sách với thư mục. Slug Danh mục không trùng danh sách (`categories/schema.ts`). Đổi slug đã công khai → ghi `PostSlugRedirect`/`CategorySlugRedirect`; `page.tsx` tra lịch sử qua `queries.ts` cache rồi `permanentRedirect()` (308); không dùng `next.config` redirects hay `proxy.ts`. Bỏ route public: giữ `page.tsx` chỉ redirect, hoặc xoá để 404, chọn từng lần.
- **AD-21** Mỗi mốc một action, chỉ ghi lần đầu: copy gợi ý chưa Duyệt → `Suggestion.firstCopiedAt` qua `suggestions.recordSuggestionCopy`; Duyệt chép sang `SocialPost.firstCopiedAt` nếu đích chưa có; copy sau Duyệt → `content-sets.recordCopy`; `postedAt` + `postUrl` qua `content-sets.markPosted`. SM-3 = `firstCopiedAt` sớm nhất của `ContentSet` − `Product.createdAt` của Sản phẩm đầu tiên. Copy chưa Duyệt được phép nhưng cảnh báo (FR-22).
- **AD-22** Mọi HTML thân Bài web (AI hoặc Vinh) qua `platform/html.sanitizePostHtml` khi ghi **và** khi render; allowlist không có `a`, `img`; không link/ảnh/giá trong thân bài; mục lục và thời gian đọc tính sau sanitize.
- **AD-23** `PostStat { postId, views, likes }` tạo lười bằng upsert; `PostViewDaily { postId, day, views }` cho cửa sổ 30 ngày. Chống trùng bằng `localStorage`; giới hạn tần suất trong bộ nhớ theo băm IP ngắn hạn, không ghi DB/log. Trình duyệt Vinh tự đánh dấu khi vào `/cms`, không gửi lượt xem; bỏ qua bot. "Xem nhiều" là query cache `cacheLife` cố định, không `updateTag` mỗi lượt xem.
- **AD-24** Upload qua `app/cms/upload/route.ts`; matcher `proxy.ts` = `["/cms", "/cms/((?!upload$).*)", "/api/:path*"]` (proxy chỉ đệm 10 MB). Route tự `requireAdmin()` trước khi đọc body; thiếu quyền 401 + `WWW-Authenticate` cùng realm. Story upload đầu tiên kiểm file > 10 MB nhận nguyên vẹn và Basic Auth chạy trên Chrome và Safari iOS. Kiểm loại + dung lượng (video ≤ 100 MB), gọi `platform/storage.put(file) → { url }`; module chỉ lưu `url`; host lưu thêm vào `platform/images.ts`.
- **AD-25** Giới hạn cứng (VarChar, Zod) ở `constants.ts` của `posts`, `content-sets`; Hồ sơ phong cách chỉ mục tiêu mềm ≤ giới hạn cứng (kiểm ở `style-profiles/schema.ts`); giá trị khởi tạo chỉ ở `style-profiles/constants.ts`. Enum `Platform` (`WEBSITE`, `THREADS`, `FACEBOOK`) khai báo một lần ở `content-sets.prisma`.
- **AD-26** SEO theo loại trang: Bài web canonical chính nó + `Article` + `BreadcrumbList`, có sitemap; Danh mục/Loại bài `BreadcrumbList`, có sitemap; trang phân trang canonical chính nó + `BreadcrumbList`, không sitemap; Trang chủ, Trang bio có sitemap, không JSON-LD; `/tim-kiem` `noindex`; CMS chặn bằng `robots`. OpenGraph lấy ảnh đại diện (fallback AD-7), không có thì ảnh mặc định trong `platform/site`.
- **AD-27** Định dạng qua `platform/format.ts` (`formatDate`, `formatCount`, vi-VN, `Asia/Ho_Chi_Minh`); thời gian tương đối chỉ phía client qua `components/shared/relative-time.client.tsx` nhận ISO.
- **Bảo mật/auth (tổng hợp)** `proxy.ts` Basic Auth cho `/cms` và `/api`; mọi action ghi qua `run()`/`requireAdmin()` (AD-6, QD-20); route upload tự `requireAdmin()` (AD-24); env bí mật thiếu thì fail closed; log chỉ trong `run()` và `platform/ai`, không log secrets/dữ liệu người đọc (Consistency Conventions).
- **Quy ước khác ảnh hưởng story** Id `String @id @default(uuid())`; giá `priceText` + `priceUpdatedAt`; trường tuỳ chọn `null` ở DB, `""` ở form; tìm không dấu qua `Post.searchText` do `posts/service.ts` ghi; nhãn/slug/màu `PostType` chỉ ở `posts/constants.ts`; route tiếng Việt không dấu; tên hàm action động từ + thực thể, query `get…` / `list…ForCms` / `get…ForCms`, schema `<x>InputSchema`; biến env mới vào `.env.example`.

#### Module và bảng sở hữu

| Module | Tầng | Model/bảng chủ |
| --- | --- | --- |
| `categories` | T0 | `Category`, `CategorySlugRedirect` |
| `style-profiles` | T0 | `StyleProfile` |
| `products` | T1 | `Product` (`categoryId`, `hidden`, `priceText`, `priceUpdatedAt`); cung cấp `AffiliateLink`, `AffiliateDisclosure`, `visibleProductWhere`, `publicProductSelect` |
| `inspirations` | T1 | `Inspiration` (trạng thái *mới*/*bỏ qua* lưu; *đã dùng* suy ra từ `ContentSet`) |
| `research` | T2 | `ResearchProfile` (`productId?` hoặc `inspirationId?`) |
| `posts` | T2 | `Post` (`categoryId`, `postType`, `searchText`), `PostProduct`, `PostSlugRedirect` |
| `banners` | T2 | `Banner` (dùng `AffiliateLink` của `products`) |
| `engagement` | T3 | `PostStat`, `PostViewDaily` |
| `content-sets` | T3 | `ContentSet` (`inspirationId?`, `postId?`, góc viết, người đọc mục tiêu), `ContentSetProduct`, `SocialPost` (`platform`, `styleProfileId`, `linkComment`, `firstCopiedAt`, `postedAt`, `postUrl`); enum `Platform` |
| `bio` | T3 | `BioSettings`, `BioItem` (`productId`, hiện, ghim, thứ tự; tạo lười, thiếu = hiện + không ghim; thứ tự: ghim theo thứ tự đặt, rồi theo `Product.createdAt` mới nhất; `products` không ghi `BioItem`) |
| `suggestions` | T4 | `Suggestion` (`firstCopiedAt?` — AD-21) |

Quan hệ (ERD): Category 1-n Post, Product; Post/Product n-n qua PostProduct; Post 1-n PostSlugRedirect; Category 1-n CategorySlugRedirect; Post 1-0..1 PostStat; Post 1-n PostViewDaily; Product, Inspiration 1-n ResearchProfile; Inspiration 1-n ContentSet; ContentSet/Product n-n qua ContentSetProduct; ContentSet 0..1-0..1 Post; ContentSet, StyleProfile 1-n SocialPost; Product, ContentSet, Inspiration 1-n Suggestion; Product 1-0..1 BioItem. `Banner`, `BioSettings` đứng riêng.

#### Deferred (điều kiện tiên quyết)

| Hạng mục | Quay lại khi / chặn gì |
| --- | --- |
| Nhà cung cấp AI cụ thể (Claude CLI / `llm.ts` miễn phí / kết hợp), nguồn tìm web, đọc ảnh | Trước story đầu tiên nhóm **FR-6..FR-15** |
| Backend lưu file (đĩa VPS, Supabase Storage, khác) | Trước story upload đầu tiên (AD-24 bind **FR-1, FR-3, FR-13, FR-32**) |
| Cách đọc nội dung video TikTok/Pinterest | Trước story **FR-2** (giai đoạn 1.5); chưa đọc được thì `skipped` có `video` |
| Hạ tầng production: nơi chạy Postgres (`.env.example` giả định Supabase), VPS, process manager, reverse proxy (body ≥ 100 MB cho `/cms/upload`; `formData()` đệm cả file vào RAM), TLS, backup | Trước khi deploy lần đầu (**NFR-10**) |
| Nhiều instance / cache và giới hạn tần suất dùng chung | Chỉ khi cần > 1 instance (spine giả định một tiến trình) |
| CI | Khi có cộng tác viên hoặc deploy tự động |
| Giám sát, log tập trung | Cùng lúc với hạ tầng production |
| Mức giới hạn tần suất cụ thể của action công khai | Chốt trong story **FR-33 / FR-35 / FR-36** |
| Phiên bản Hồ sơ phong cách | Khi cần so hiệu quả giữa các bản hồ sơ (liên quan FR-18) |

#### Luật bắt buộc từ quy-dinh.md

Vi phạm là blocker.

- **[QD-01]** Không `git commit`/`push`/`reset --hard`/`rebase`/viết lại lịch sử; để thay đổi trong working tree.
- **[QD-02]** Không sửa `generated/`; chạy `npx prisma generate`.
- **[QD-03]** Không sửa tay khối `nextjs-agent-rules` và `bmad:context` trong `AGENTS.md`.
- **[QD-04]** Không thêm thư viện khi thư viện đang có làm được; cần thì nêu lý do và hỏi trước.
- **[QD-05]** Không đọc/in/log/chép giá trị `.env` vào code, tài liệu, commit, chat, prompt AI.
- **[QD-06]** Biến môi trường mới thêm vào `.env.example` với giá trị giả + chú thích.
- **[QD-07]** Chỉ chạy `prisma migrate`/ghi dữ liệu trên Postgres cục bộ (docker, cổng 54329).
- **[QD-08]** Nội dung AI là Gợi ý *chờ duyệt*; không xuất bản Bài web có phần AI chưa Duyệt (FR-22).
- **[QD-09]** Không OpenAI; mọi lời gọi AI qua một lớp chung, không gọi thẳng SDK.
- **[QD-10]** Ngân sách 0đ/tháng; không dịch vụ trả phí; free tier phải ghi rõ giới hạn.
- **[QD-11]** Prompt cấm bịa số liệu, giá, công dụng y khoa/mỹ phẩm tuyệt đối; yêu cầu tiếng Việt có dấu chuẩn.
- **[QD-12]** HTML bài luôn qua `sanitizePostHtml` trước khi lưu; thân bài không link, ảnh, giá.
- **[QD-13]** Link affiliate thuộc domain Shopee chính chủ, hiển thị nguyên link, không bọc qua redirect của website.
- **[QD-14]** Mọi link affiliate có `target="_blank"` và `rel="sponsored nofollow noopener"` (mẫu hiện ghi `components/site/product-card.tsx`; AD-17 đổi thành `AffiliateLink`).
- **[QD-15]** Mọi Bài web có Sản phẩm và Trang bio luôn hiện Nhãn công khai affiliate, không tuỳ chọn tắt (FR-24).
- **[QD-16]** Ẩn Sản phẩm có hiệu lực toàn website trong khoảng 1 phút (FR-5, NFR-5).
- **[QD-17]** Không cào Shopee, không tự tạo link affiliate, không tự đăng lên Threads/Facebook.
- **[QD-18]** Không thu thập dữ liệu cá nhân người đọc; Lượt xem/tim chỉ dùng định danh ẩn danh tối thiểu (NFR-7); không thêm tracker bên thứ ba khi chưa hỏi.
- **[QD-19]** Không tài khoản người đọc, không bình luận trên website (giai đoạn 2).
- **[QD-20]** Mọi Server Action ghi gọi `requireAdmin()` qua `run()`; ngoại lệ có tên: action `engagement` và `posts.searchPosts` (validate, giới hạn tần suất, không lưu định danh). (Route upload chưa được ghi — AD-17 bước 4 sửa.)
- **[QD-21]** Kiểm quyền và validate ở server, không tin client.
- **[QD-22]** Thứ tự nguồn sự thật: PRD final → kiến trúc → code hiện tại → `docs/PRD_AFFILIATE_PROJECT.md`.
- **[QD-23]** Spec/code mâu thuẫn hoặc thiếu: BLOCKER thì dừng hỏi; MINOR thì làm theo giả định hợp lý và ghi rõ.
- **[QD-24]** Không tự mở rộng phạm vi; đề xuất thay vì tự làm.

#### Ánh xạ FR → AD

Từ bảng *Capability → Architecture Map* của spine, bổ sung bằng dòng **Binds** của từng AD.

| PRD | Module | AD (bảng Capability map) | AD thêm theo dòng Binds |
| --- | --- | --- | --- |
| FR-1, FR-2 Cảm hứng | `inspirations`, `research`, `suggestions` | AD-9, AD-18, AD-19, AD-24 | FR-2: AD-9, AD-10 (video `skipped`) |
| FR-3..FR-5 Kho sản phẩm, Ẩn | `products` | AD-4, AD-7, AD-14, AD-15 | FR-3: AD-24; FR-5: AD-7 |
| FR-6..FR-11 Nghiên cứu AI | `research`, `suggestions`, `platform/ai` | AD-9, AD-10, AD-18, AD-19 | FR-11: AD-19 |
| FR-12..FR-21 Xưởng nội dung | `content-sets`, `style-profiles`, `suggestions` | AD-9, AD-10, AD-18, AD-19, AD-21, AD-25 | FR-13: AD-22, AD-24; FR-13..FR-18: AD-25; FR-12, FR-19, FR-20: AD-21 |
| FR-22, FR-23 Duyệt, cảnh báo | `suggestions` | AD-9, AD-16, AD-19 | — |
| FR-24, FR-25 Nhãn, quy tắc link | `products/components` | AD-11, AD-14 | — |
| FR-26, FR-27 Trang bài, CMS bài | `posts` | AD-7, AD-11, AD-12, AD-20, AD-22 | — |
| FR-39, FR-40 Nhập từ URL, AI chỉnh sửa | `posts`, `platform/ai` | AD-9 (ngoại lệ có tên), AD-10, AD-22 | — |
| FR-28, FR-29 Danh mục | `categories` | AD-4, AD-7, AD-20 | FR-29: AD-7 |
| FR-30, FR-31 Trang bio | `bio`, `products` | AD-7, AD-11 | — |
| FR-32 Banner | `banners` | AD-7, AD-11, AD-24 | — |
| FR-33..FR-35, FR-38 Lượt xem, tim, thống kê | `engagement` | AD-6, AD-23 | — |
| FR-36 Tìm kiếm | `posts` | AD-6, AD-7 | — |
| FR-37 Chia sẻ | `components/shared` | AD-11 | — |
| NFR-1, NFR-2, NFR-3, NFR-9 | `platform/ai` | AD-10, AD-18 | — |
| NFR-4, NFR-11 | `app/cms`, `components` | AD-11, AD-14 | — |
| NFR-5 | `queries.ts` | AD-7 | — |
| NFR-6 | `platform/auth`, `proxy.ts` | AD-6 | — |
| NFR-7 | `engagement` | AD-23 | AD-6 |
| NFR-8 SEO | `app/sitemap.ts`, `app/robots.ts`, metadata `page.tsx` | AD-7, AD-12, AD-20, AD-26 | — |
| NFR-10 Triển khai, dữ liệu cũ | epic nền | AD-17; Deferred | — |

AD áp cho mọi story (Binds: all / mọi file): AD-1, AD-2, AD-3, AD-4, AD-5, AD-11, AD-13, AD-17, AD-27. AD-9 còn bind chỉ số SM-C2; AD-21 bind SM-2, SM-3.

### UX Design Requirements

#### A. Token thiết kế (Tailwind 4 + shadcn)

UX-DR1: **Token màu light → CSS variables.** Khai báo mỗi màu đúng một lần thành CSS variable trong theme Tailwind, lấy nguyên giá trị `theme.namedColors` của Stitch "Warm Editorial Living" (vd. `primary #a33b19`, `primary-container #c4532f`, `secondary #38684d`, `secondary-container #baefcc`, `tertiary-fixed #ffdbd1`, `error #ba1a1a`, `surface #fff8f5`, `surface-container-lowest #ffffff` … `surface-container-highest #ece0da`, `on-surface #201b17`, `on-surface-variant #57423c`, `outline #8b716a`, `outline-variant #dec0b7`, `inverse-surface #352f2b`…). **Chỉ token có cặp `-dark` mới được xuất thành biến**; 15 token chỉ-light (primary-fixed-dim, on-primary-fixed-variant, inverse-primary, surface-tint, secondary-fixed, secondary-fixed-dim, on-secondary-fixed, on-secondary-fixed-variant, on-tertiary, tertiary-container, on-tertiary-container, tertiary-fixed-dim, on-tertiary-fixed-variant, surface-dim, surface-bright) không xuất, không dùng. Kiểm được: grep component không có mã hex; đổi một biến thì cả site public và CMS đổi theo; không pha màu "Botanical Living Editorial" hay #C4532F làm primary. Nguồn: D › frontmatter `colors`, D › Colors "Cấu hình một chỗ", D › Do's and Don'ts.

UX-DR2: **Dark mode theo hệ thống.** Bộ giá trị `-dark` (frontmatter, vd. `surface-dark #1f1b18`, `surface-container-lowest-dark #29231f`, `primary-dark #d96b47`, `primary-container-dark #b34a2a`, `secondary-container-dark #223328`, `tertiary-fixed-dark #3d261e`, `inverse-surface-dark #f2ebe3`…) là giá trị thứ hai của cùng biến, áp qua `prefers-color-scheme`; mọi biến đã xuất đều có bản dark. **Không có nút đổi theme tay** ("Thử tông trầm"). Dark: bỏ bóng, phân lớp bằng `surface-container-*-dark` + viền `outline-variant-dark`. Mỗi trang phải đúng ở cả light và dark (Stitch không có dark → dựng theo token). Nguồn: D › frontmatter (DARK), D › Colors, D › Elevation & Depth, D › Do's and Don'ts; E › Foundation, E › Responsive & Platform. FR/NFR: NFR-11.

UX-DR3: **Ánh xạ biến shadcn.** `background`→surface · `foreground`→on-surface · `card`/`popover`→surface-container-lowest · `primary`→primary · `primary-foreground`→on-primary · `secondary`→surface-container-low · `muted`→surface-container · `muted-foreground`→on-surface-variant · `accent`→surface-container-high · `border`/`input`→outline-variant · `ring`→primary · `destructive`→error; mỗi biến có cặp `-dark`. Nguồn: D › Colors "Ánh xạ sang biến shadcn".

UX-DR4: **Vai trò màu trên site public và ràng buộc tương phản.** Áp bảng vai trò (nền trang, thẻ, khối trầm, chữ chính/phụ, điểm nhấn đất nung, CTA Shopee chỉ cho AffiliateLink, xô thơm chỉ cho badge Mẹo vặt, đất nung nhạt chỉ cho badge Gom link, nhấn nhẹ `primary-fixed`, đường kẻ, lỗi) cùng cột "Không dùng cho". Ràng buộc: chữ trên `primary-container` ≥ 12px, đậm 500 (4.54:1); giá trên thẻ dark giữ `headline-sm` 600; `outline` (4.3:1) chỉ cho icon/viền, không cho chữ; `outline-variant` không cho chữ mang nghĩa (ngoại lệ duy nhất: số trang trí PostCard *rank*). Kiểm được bằng bảng tỉ lệ tương phản đã kiểm (on-surface/surface 16.3:1 · 14.5:1, v.v.). Nguồn: D › Colors (bảng vai trò, bảng tương phản).

UX-DR5: **Typography.** Một họ chữ Be Vietnam Pro cho cả site public và CMS. Cài thang: `headline-display` 36/46 600 −0.02em, `headline-display-mobile` 28/36, `headline-lg` 26/34, `headline-lg-mobile` 22/30, `headline-md` 19/26, `headline-sm` 16/22, `body-lead` 17/28, `body-regular` 15/25, `body-sm` 13/20, `label-md` 14/18 500, `label-sm` 12/16 500 +0.02em, `label-meta` 11/14 600 +0.04em. Ánh xạ vai trò: H1 bài/tiêu đề trang `headline-lg-mobile`→desktop `headline-display`; tiêu đề Bài nổi bật `headline-display-mobile`→`headline-display`; tiêu đề khu và H2 thân bài `headline-md`→`headline-lg`; thân bài `body-lead`, khung chữ 65–75 ký tự; meta/badge/nhãn tab `label-meta`. Không viết hoa toàn bộ trừ `label-meta` trong badge. CMS giữ thang shadcn nhưng đổi font sang Be Vietnam Pro. Nguồn: D › frontmatter `typography`, D › Typography.

UX-DR6: **Rounded / Shapes.** Token `sm 0.125rem · DEFAULT 0.25rem · md 0.375rem · lg 0.5rem · xl 0.75rem · full 9999px`. Áp: thẻ, khối, Banner, AffiliateDisclosure, TOC → `xl`; ảnh trong thẻ, nút chữ nhật, input → `lg`; badge Loại bài → `DEFAULT`; chip, nút tròn, nút "Đồ hay", tab đang chọn, nút trên ArticleActionBar → `full`. CMS giữ radius mặc định shadcn. Nguồn: D › frontmatter `rounded`, D › Shapes.

UX-DR7: **Spacing, lưới và vùng bấm.** Token `gutter 1rem · gutter-desktop 1.5rem · margin 1rem · margin-tablet 2rem · margin-desktop 3rem · space-xs/sm/md/lg/xl = 0.25/0.5/1/1.5/2.5rem · container-max 1120px · touch-target 44px`. Lưới: < 768px một cột lề `margin`; 768–1023px 6 cột lề `margin-tablet` gutter `gutter-desktop`; ≥ 1024px 12 cột lề `margin-desktop`, khung tối đa 1120px căn giữa; trang bài 8 + 4 cột (cột phải dính). Khoảng: giữa khu `space-xl`, giữa khối `space-lg`, padding thẻ `space-md` (mobile)/`space-lg` (desktop); tối thiểu `space-md` trong thẻ, `margin` sát mép màn (nới chỗ Stitch chật). Phần tử hình < 44px (chip, nút Shopee 36px) nới vùng bấm tới 44px bằng `::before` trong suốt inset âm 4px trên/dưới; khoảng giữa hai phần tử như vậy ≥ `space-sm`. Header/BottomTabBar cố định: nội dung có padding tương ứng + `safe-area-inset`. Ảnh tỉ lệ cố định: đầu bài 16:9, PostCard 16:9, ProductCard 1:1. Chuẩn 390px, kiểm ở 360px. Nguồn: D › frontmatter `spacing`, D › Layout & Spacing, D › Do's and Don'ts. FR/NFR: NFR-5.

UX-DR8: **Elevation.** Mức 0 (khối nằm): `surface-container-lowest` trên `surface` + bóng `0 1px 8px rgba(47,41,37,0.04)`; Mức 1 (hover/dropdown/Sheet): `0 4px 16px -2px rgba(47,41,37,0.05), 0 1px 3px rgba(47,41,37,0.03)`; thanh dính (SiteHeader, BottomTabBar, ArticleActionBar): nền `surface` 90% + `backdrop-filter: blur(12px)` + bóng 1px hướng ra ngoài; dark bỏ bóng. Nguồn: D › Elevation & Depth.

UX-DR9: **Token component (frontmatter `components`).** Cài các token hợp thành: `site-header` (surface 90%, blur 12px, cao 64px), `bottom-tab-bar` (item-min 44px, active primary, inactive on-surface-variant, nhãn label-meta), `post-card`, `post-type-badge-meo-vat`, `post-type-badge-gom-link`, `product-card` (thumb 80px, thumb-radius lg, giá headline-sm màu primary), `affiliate-link-button` (primary-container, radius lg, cao 36px, hit-area 44px, label-sm), `affiliate-disclosure`, `button-primary`, `chip` (surface-container-high/on-surface-variant, active primary/on-primary, full, cao 36px, hit-area 44px), `article-action-bar` (nút 44px, full), `toc`, `callout` (primary-fixed), `banner` (CTA primary, full), `toast` (inverse-surface/inverse-on-surface, radius lg). Ánh xạ tên: `affiliate-link-button` = hình "nút Shopee" của AffiliateLink; `toc` = TableOfContents; `post-card` = PostCard. Nguồn: D › frontmatter `components`, D › Components "Ánh xạ tên".

UX-DR10: **Icon Lucide.** Dùng Lucide nét 1.25–1.5px; không Material Symbols, không icon nét 2px. Nguồn: D › Components (đầu mục), D › Do's and Don'ts.

#### B. Component — site public

UX-DR11: **SiteHeader.** Hình: token `site-header`; mobile logo chữ "Mẹo Vặt Cuộc Sống" + dòng phụ "Tạp chí tổ ấm nhỏ" (`label-meta`) + nút tìm kiếm; desktop thêm nav ngang (Mẹo vặt, Gom link, các Danh mục theo thứ tự, Danh mục không vừa gom vào menu "Thêm"), nút tìm, nút "Đồ hay" (`primary-fixed`, `full`). Không avatar, không bookmark. Hành vi: dính đỉnh; cuộn quá chiều cao header thì ẩn dòng phụ, giữ logo + nút; nút tìm → `/tim-kiem` với SearchBox tự focus. Nguồn: D › Components › SiteHeader; E › Component Patterns › SiteHeader; E › IA › Điều hướng mobile (dòng Desktop).

UX-DR12: **BottomTabBar.** Chỉ < 1024px (cả tablet), trừ trang bài. 5 tab: Tạp chí (`house`, `/`), Mẹo vặt (`lightbulb`, `/meo-vat`), Gom link (`tag`, `/gom-link`), Danh mục (`layout-grid`, mở CategorySheet), Đồ hay (`shopping-bag`, `/bio`); icon 24px + nhãn; tab đang chọn màu `primary`, đậm 600. Tab khớp route hiện tại kể cả `/trang/n`; trên trang Danh mục tab "Danh mục" được chọn. Không tự ẩn khi cuộn. A11y: `nav aria-label="Điều hướng chính"`, tab hiện tại `aria-current="page"`. Nguồn: D › Components › BottomTabBar; E › IA › Điều hướng mobile; E › Component Patterns › BottomTabBar; E › Accessibility Floor. Q6.

UX-DR13: **CategorySheet.** Sheet đáy nền `surface-container-lowest`, góc trên `xl`, mỗi dòng cao 44px. Liệt kê mọi Danh mục có ≥ 1 Bài web đã xuất bản, theo thứ tự hiển thị; chạm dòng → `/[danh-muc]` và đóng Sheet; đóng bằng vuốt xuống / Esc / chạm nền; bẫy focus, trả focus về nút mở. Nguồn: D › Components › CategorySheet; E › Component Patterns › CategorySheet; E › Interaction Primitives; E › Accessibility Floor.

UX-DR14: **SiteFooter.** Nền `surface-container-low`, padding `space-xl`: tên + giới thiệu ngắn, link Danh mục, link `/bio`, AffiliateDisclosure dạng chữ, ©. Không newsletter, không link trang tĩnh. Link mở cùng tab; trên mobile có padding đáy bằng chiều cao BottomTabBar/ArticleActionBar. Nguồn: D › Components › SiteFooter; E › IA (SiteFooter); E › Component Patterns › SiteFooter. Q9.

UX-DR15: **Banner.** Hình: token `banner`, ảnh trái/trên, tiêu đề `body-sm` đậm 500, mô tả, CTA pill `primary` (chỉ là hình), nhãn nhỏ `tertiary-fixed`. Hành vi: chỉ Banner đang bật và trong lịch; 0 banner không render, không chừa chỗ; ≥ 2 thì dải cuộn ngang snap có chấm vị trí, **không tự chạy**; cả Banner là một link (đích Shopee = AffiliateLink, đích nội bộ = link thường cùng tab); không vỡ ở 360px; ảnh lỗi → ImageFallback. Nguồn: D › Components › Banner; E › Component Patterns › Banner; E › State Patterns. FR-32, FR-25.

UX-DR16: **PostCard.** Hình: token `post-card`; biến thể *featured* (ảnh 16:9, badge trên ảnh, tiêu đề lớn), *grid*, *row* (thumbnail trái 80px), *rank* (số `01`–`05` `headline-lg` màu `outline-variant`, `aria-hidden`, danh sách là `<ol>`). Hover desktop: ảnh phóng 3–5% (tắt khi reduced-motion), tiêu đề đổi `primary`. Hành vi: cả thẻ một link tới bài; hiện PostTypeBadge, tiêu đề, tóm tắt (featured/grid), ngày · phút đọc; **không** hiện Lượt xem, Lượt tim, tác giả. Nguồn: D › Components › PostCard; E › Component Patterns › PostCard; E › Accessibility Floor. Q5.

UX-DR17: **RelatedPosts.** Cuối Bài viết, tiêu đề khu `headline-md`; tối đa 3 Bài web cùng Danh mục, mới nhất trước; mobile PostCard *row*, desktop *grid* 3 cột; < 3 bài hiện số có, 0 bài ẩn khu. Nguồn: D › Components › RelatedPosts; E › Component Patterns › RelatedPosts; E › State Patterns › Bài viết. FR-26.

UX-DR18: **PostTypeBadge.** Hai biến thể "Mẹo vặt" (`secondary-container`/`on-secondary-container`) và "Gom link" (`tertiary-fixed`/`on-tertiary-fixed`), radius `DEFAULT`, `label-meta`, chữ hoa; chỉ hiển thị, không là link. Nguồn: D › Components › PostTypeBadge; E › Component Patterns › PostTypeBadge.

UX-DR19: **PostTags.** Dòng cuối thân bài: "#tag" chữ thường `label-sm` `on-surface-variant`, cách nhau `space-sm`, không nền, **không link**; bài không có thẻ thì ẩn. Nguồn: D › Components › PostTags; E › Component Patterns › PostTags. FR-26.

UX-DR20: **ProductCard (*row* và *tile*).** Hình: token `product-card`; *row* (bài viết, `/bio`): ảnh vuông 80px trái, phải là tên ≤ 2 dòng, dòng "Giá tham khảo" (`label-meta`) + giá `primary` + "cập nhật dd/mm/yyyy" (`label-meta`), nút Shopee; dấu Ghim (bio) icon pin trên nền `primary-fixed`. *tile* (dải Trang chủ): rộng 160px mobile / 1 trong 4 cột desktop, ảnh 1:1 rộng hết thẻ `lg`, tên 2 dòng, giá + ngày, nút Shopee rộng hết thẻ. Hover: nền `surface-container-low`. Hành vi: **cả thẻ là một `<a>` duy nhất** (AffiliateLink) bọc ảnh, tên, giá, ngày, nút (nút chỉ là hình); không phần tử bấm lồng; Sản phẩm ẩn không bao giờ hiện. Không mô tả ngắn, không giá gạch, % giảm, sao, huy hiệu. A11y: tên truy cập theo thứ tự tên → giá → "Xem trên Shopee" + nhãn ẩn "mở Shopee trong tab mới"; ảnh `alt=""`; dấu Ghim có chữ ẩn "Nổi bật". Ảnh lỗi → ImageFallback, thẻ vẫn bấm được. Nguồn: D › Components › ProductCard *row*/*tile*; E › Component Patterns › ProductCard; E › Accessibility Floor; E › Giả định đã chốt (Q7). FR-3, FR-5.

UX-DR21: **AffiliateLink.** Component thuộc tính link nhận `children`: nguyên link Shopee, tab mới, `rel="sponsored nofollow noopener"`, không qua `/go`, không đếm click. Hình "nút Shopee": chữ "Xem trên Shopee" + icon external-link 14px, cao 36px, vùng bấm 44px; hover độ mờ 95%. Trong ProductCard và Banner bọc cả thẻ. Nguồn: D › Components › AffiliateLink; E › Component Patterns › AffiliateLink. FR-25, AD-11.

UX-DR22: **AffiliateDisclosure.** Hình: token `affiliate-disclosure`, icon tròn 28px, "Minh bạch liên kết:" đậm `on-surface` + câu công khai; không bao giờ giảm độ mờ, thu nhỏ hay giấu. Vị trí: bài có ≥ 1 Sản phẩm — ngay dưới dòng meta, trước ảnh đầu bài; bài không có Sản phẩm — không render; `/bio` — đầu trang, luôn hiện, không đóng được; Trang chủ — dòng chữ ngắn ngay dưới tiêu đề dải "Gom link đồ xinh"; footer — dạng chữ. Câu trên bài là câu mặc định (Voice and Tone); câu trên `/bio` lấy từ CMS. Nguồn: D › Components › AffiliateDisclosure; E › Component Patterns › AffiliateDisclosure; E › Voice and Tone. FR-24, FR-30, FR-31.

UX-DR23: **TableOfContents.** Hình: token `toc`. Sinh từ h2 (sau sanitize); < 2 h2 thì ẩn. Mobile: mục đánh số, khối có mũi tên, **mặc định mở**, chạm tiêu đề để thu. Chạm mục: cuộn mượt tới h2, chừa chiều cao header (tắt cuộn mượt khi reduced-motion). Desktop: dính cột phải, mục đang đọc màu `primary`. Nguồn: D › Components › TableOfContents; E › Component Patterns › TableOfContents. AD-22.

UX-DR24: **ArticleBody (+ Callout).** `body-lead`; H2 đánh số trong vòng tròn `primary-fixed`; `blockquote` hiển thị như Callout "Mẹo nhỏ" (token `callout`). Chỉ hiển thị HTML đã sanitize; không link, ảnh, giá trong thân. Nguồn: D › Components › ArticleBody; E › Component Patterns › ArticleBody. FR-13, AD-22.

UX-DR25: **LikeButton.** Pill `surface-container-low`, icon tim + số; đã thả: tim đặc `primary`. Vị trí: cuối bài + ArticleActionBar; desktop cột phải. Chạm: đổi trạng thái ngay (optimistic) + số ±1; chạm lại bỏ tim; trạng thái nhớ theo trình duyệt (localStorage); số tim tải phía client, chưa có/lỗi thì giữ chỗ cố định rộng, hiện "—", vẫn bấm được; bị giới hạn tần suất/lỗi → hoàn trạng thái + Toast "Chưa thả tim được, thử lại sau nhé". Hiệu ứng nảy ≤ 200ms (tắt khi reduced-motion). A11y: `aria-pressed`, nhãn có số ("Đã thả tim, 342 lượt"). Nguồn: D › Components › LikeButton; E › Component Patterns › LikeButton; E › State Patterns › Bài viết; E › Interaction Primitives; E › Accessibility Floor. FR-35, AD-23.

UX-DR26: **ShareButtons.** Nút tròn 44px: Facebook, Threads, Sao chép link (nút cuối nền `primary`). Mobile có `navigator.share`: nút chia sẻ chính mở chia sẻ gốc; người dùng huỷ → không làm gì, không Toast. Facebook/Threads mở trang chia sẻ ở tab mới. Sao chép ghi URL canonical + Toast "Đã sao chép liên kết"; clipboard bị chặn → Toast "Chưa sao chép được, bạn giữ ngón tay lên thanh địa chỉ để chép nhé". `aria-label` tiếng Việt ("Chia sẻ lên Threads", "Sao chép link"). Vị trí: cuối bài, ArticleActionBar, desktop (xem mâu thuẫn ở báo cáo). Nguồn: D › Components › ShareButtons; E › Component Patterns › ShareButtons; E › State Patterns › Bài viết. FR-37.

UX-DR27: **ArticleActionBar.** Token `article-action-bar`, dính đáy trang bài mobile, thay chỗ BottomTabBar: trái LikeButton + "Sản phẩm" (cuộn tới khối Sản phẩm; bài không có Sản phẩm thì ẩn nút), phải ShareButtons. Nguồn: D › Components › ArticleActionBar; E › Component Patterns › ArticleActionBar; E › IA. FR-24.

UX-DR28: **Breadcrumb.** "Trang chủ › {Danh mục}" (một cấp Danh mục, không cấp 3), `label-sm` `on-surface-variant`; mỗi cấp là link trừ cấp cuối. Dùng ở Bài viết, Danh mục. Nguồn: D › Components › Breadcrumb; E › Component Patterns › Breadcrumb.

UX-DR29: **Pagination.** Nút "Trang trước/Trang sau" + số trang, mỗi ô ≥ 44px, trang hiện tại nền `primary`. Link tĩnh: trang 1 = `/[danh-muc]` · `/meo-vat` · `/gom-link`; trang n = `…/trang/n`; `/…/trang/1` chuyển hướng về trang gốc; hiện trang đầu, cuối, ±1 quanh trang hiện tại; chỉ 1 trang thì ẩn; trang n vượt quá → 404. Không "tải thêm". Nguồn: D › Components › Pagination; E › Component Patterns › Pagination; E › Foundation; E › State Patterns. AD-7.

UX-DR30: **FilterChips.** Token `chip`: cao 36px, vùng bấm 44px, cách nhau `space-sm`, hàng cuộn ngang không thanh cuộn, chip chọn cuộn vào giữa. `/bio`: chip đầu "Tất cả" + mỗi Danh mục có Sản phẩm hiện, kèm số món; lọc phía client tức thì, không đổi URL. Tìm kiếm (chưa gõ): mỗi Danh mục có Bài web đã xuất bản, không "Tất cả", không số; chạm → `/[danh-muc]`. Nguồn: D › Components › FilterChips; E › Component Patterns › FilterChips. FR-30.

UX-DR31: **SearchBox.** Input lớn nền `surface-container-lowest`, viền `outline-variant`, focus viền `primary` 1.5px, icon kính lúp trái, nút xoá phải. Gõ → tìm sau 300ms ngừng gõ, tối thiểu 2 ký tự (1 ký tự: giữ nguyên trạng thái trước, không báo lỗi); Enter tìm ngay; nút xoá làm rỗng và focus lại; khớp không dấu; không ghi log từ khoá. Nguồn: D › Components › SearchBox; E › Component Patterns › SearchBox; E › State Patterns › Tìm kiếm. FR-36, NFR-7.

UX-DR32: **SearchResultItem.** PostCard *row* + từ khớp highlight nền `primary-fixed`; kèm dòng "Tìm thấy N bài viết cho "…"" (`aria-live="polite"`); chỉ Bài web, không tab "Shopee". Nguồn: D › Components › SearchResultItem; E › Component Patterns › SearchResultItem; E › Accessibility Floor. Q4.

UX-DR33: **EmptyState.** Minh hoạ nét mảnh (tách trà + mầm cây) màu `primary`/`secondary`, tiêu đề `headline-md`, một câu gợi ý, một nút chính; có thể kèm danh sách gợi ý (Xem nhiều). Dùng ở tìm kiếm rỗng, 404, Danh mục rỗng, bio rỗng, trang lỗi. Nguồn: D › Components › EmptyState; E › Component Patterns › EmptyState.

UX-DR34: **Skeleton.** Khối `surface-container` cùng kích thước và tỉ lệ ảnh với component thật, trong `<Suspense>`; không nhấp nháy khi reduced-motion; thay bằng nội dung thật không nhảy layout. Nguồn: D › Components › Skeleton; E › Component Patterns › Skeleton; E › Foundation. NFR-5, AD-12.

UX-DR35: **ImageFallback.** Ảnh ngoài (Shopee CDN) lỗi tải/bị gỡ: khung `surface-container` cùng tỉ lệ, icon `image-off` `outline` 24px giữa khung, `alt` giữ nguyên; thẻ vẫn bấm được. Dùng cho ProductCard, PostCard, Banner. Nguồn: D › Components › ImageFallback; E › State Patterns › Site public.

UX-DR36: **Toast (site public).** Token `toast`, đáy màn, nằm trên ArticleActionBar/BottomTabBar; hiện 3 giây, không chặn thao tác, `aria-live="polite"`. Nguồn: D › Components › Toast; E › Component Patterns › Toast.

#### C. Component — CMS

UX-DR37: **Delta chung CMS trên shadcn base-nova.** Kế thừa nguyên shadcn; font Be Vietnam Pro; radius mặc định shadcn; trên mobile mọi `Button`, `Input`, dòng `Checkbox`/`RadioGroup` cao 44px (nâng từ 36px); nền trang `surface`, `Card` `surface-container-lowest`. Không kéo-thả, sắp thứ tự bằng nút lên/xuống; không phím tắt riêng. Nguồn: D › Components › CMS (đầu mục); E › Interaction Primitives (CMS). AD-14.

UX-DR38: **CmsShell.** Dựng từ `Sheet` + `Sidebar`. Thanh trên dính nền `surface`, tên mục hiện tại `headline-sm` + nút menu mở `Sheet` trái liệt kê các mục danh sách theo thứ tự IA (Bài web, Sản phẩm, Cảm hứng, Danh mục, Banner, Trang bio, Hồ sơ phong cách, Styleguide; không có Gốc CMS, Soạn Bài web, Chi tiết Sản phẩm, Bộ nội dung); desktop ≥ 1024px là sidebar cố định. Mục đang chọn: nền `surface-container-high`, chữ `primary`. Nút "Xem site" mở `/` ở tab mới. Toast (Sonner) hiển thị lỗi `UserError` từ server. Nguồn: D › Components › CmsShell; E › IA › Điều hướng CMS; E › Component Patterns › CmsShell. AD-14.

UX-DR39: **DataList.** Mobile: danh sách `Card`, mỗi thẻ là link tới chi tiết, dòng 1 tên `headline-sm` + StatusBadge bên phải, dòng 2 meta `body-sm` `on-surface-variant`; desktop: `Table`. Lọc/tìm/sắp xếp/trang qua `?q`, `?trang` và tham số lọc trên URL. Nút tạo mới dính đáy trên mobile, rộng hết màn trừ lề `margin`. Rỗng: một câu + nút tạo ("Chưa có Sản phẩm nào. Tạo Sản phẩm đầu tiên."); lọc không ra: "Không có kết quả với bộ lọc này" + nút Xoá bộ lọc. Nguồn: D › Components › DataList; E › Component Patterns › DataList; E › State Patterns › CMS. AD-12.

UX-DR40: **StatusBadge.** Dựng từ `Badge`, luôn có chữ (không chỉ màu). Nhãn: Bài web Nháp/Đã xuất bản; Sản phẩm Hiện/Ẩn; Cảm hứng Mới/Đã dùng/Bỏ qua; Gợi ý AI Đang tạo/Chờ duyệt/Đã duyệt/Đã từ chối/Lỗi (`SUPERSEDED` không hiện); Bài mạng xã hội Chưa đăng/Đã đăng; Banner Tắt/Chờ lịch/Hết hạn/Đang hiện. Màu: Trung tính `surface-container-high`/`on-surface-variant` (Nháp · Ẩn · Bỏ qua · Đã từ chối · Chưa đăng · Tắt · Hết hạn · Đang tạo); Chờ xử lý `tertiary-fixed`/`on-tertiary-fixed` (Chờ duyệt · Mới · Chờ lịch); Xong/đang chạy `secondary-container`/`on-secondary-container` (Đã duyệt · Đã xuất bản · Hiện · Đã dùng · Đã đăng · Đang hiện); Lỗi `error-container`/`on-error-container`; dark dùng cặp `-dark`. "Đang tạo" có icon `loader-circle` quay, dừng khi reduced-motion. Nguồn: D › Components › StatusBadge + bảng "StatusBadge — nhãn → token"; E › Component Patterns › StatusBadge.

UX-DR41: **SuggestionCard.** Một thẻ = một Gợi ý AI; dùng ở Bộ nội dung, Chi tiết Sản phẩm (hồ sơ, Danh mục gợi ý), Cảm hứng. Anatomy: đầu thẻ tên phần (`headline-sm`: "Bài web", "Bài Threads", "Bình luận kèm link · Threads"…) + StatusBadge; RiskWarning trên thân. Thân theo `kind`: Bài web = `Input` tiêu đề + `Textarea` tóm tắt + PostEditor (thu gọn 8 dòng, nút "Mở toàn bộ") + SEO trong `Accordion`; chuỗi Threads = mỗi bài một khối viền `outline-variant` có số "2/6" (`label-meta`), `Textarea` tự giãn, bộ đếm "182/500" (> 500 → màu `error`, `aria-live`) + CopyButton; Facebook = một `Textarea` + đếm từ + CopyButton; Bình luận = `Textarea` + CopyButton. Chân thẻ: mobile "Duyệt" primary rộng hết thẻ, hàng dưới "Từ chối" (outline) + "Tạo lại" (ghost) chia đôi; desktop ba nút cùng hàng căn phải; không dính, không "Duyệt tất cả". Trạng thái: GENERATING → GeneratingIndicator; PENDING → sửa được + RiskWarning + Duyệt/Từ chối/Tạo lại; APPROVED → sửa **đích** bằng form của module chủ đích (không đổi trạng thái), riêng Bài web sửa ở Soạn Bài web; REJECTED → thu còn đầu thẻ + "Tạo lại"; FAILED → `Alert` nền `error-container`, lỗi tiếng Việt + "Tạo lại", thẻ khác không ảnh hưởng. Điều kiện tắt "Duyệt" (kèm lý do): Threads có bài > 500 ký tự ("Bài 3 vượt 500 ký tự"); Bình luận khi bài cùng nền tảng chưa Duyệt ("Duyệt bài {Threads|Facebook} trước"); Bài web đích đã xuất bản ("Bài đã xuất bản — sửa tay ở Soạn Bài web"). Không thêm/xoá bài trong chuỗi. Danh mục gợi ý không có Tạo lại. Nguồn: D › Components › SuggestionCard + "SuggestionCard — anatomy"; E › Component Patterns › SuggestionCard; E › IA › Màn Bộ nội dung. FR-12, FR-14, FR-22, AD-19.

UX-DR42: **GeneratingIndicator.** Bọc `modules/suggestions/components/generating-poller.client.tsx`. Thay thân thẻ: dòng "Đang viết {phần}…" `body-sm` + thanh tiến trình không xác định `primary` trên `surface-container-high` + thời gian đã chạy "0:42" `label-meta`; dưới là 3 dòng Skeleton. `router.refresh()` mỗi 3 giây, dừng sau 120 giây → coi là Lỗi; rời màn rồi quay lại vẫn thấy trạng thái thật; `aria-live="polite"`. Nguồn: D › Components › GeneratingIndicator; E › Component Patterns › GeneratingIndicator; E › Accessibility Floor. AD-18, NFR-3.

UX-DR43: **RiskWarning.** `Alert` nền `tertiary-fixed`, chữ `on-tertiary-fixed`, icon `triangle-alert`; mỗi mục: câu trích (nghiêng, 1 dòng, cắt …) + lý do `body-sm`, mỗi mục là nút cao ≥ 44px. Chạm mục: cuộn (mượt) và highlight câu trong nội dung/PostEditor (câu bị cảnh báo gạch chân lượn `tertiary`; đang chọn nền `tertiary-fixed`). Không chặn Duyệt. Nguồn: D › Components › RiskWarning; E › Component Patterns › RiskWarning, PostEditor. FR-23.

UX-DR44: **CopyButton.** `Button` outline sm, icon `copy` + "Sao chép"; sau khi chép: icon `check` + "Đã sao chép" màu `secondary` trong 2 giây; vùng bấm ≥ 44px. Một chạm sao chép; Gợi ý AI chưa Duyệt: chạm lần đầu mở `AlertDialog` "Nội dung này chưa duyệt. Vẫn sao chép?" (Sao chép / Huỷ); ghi `firstCopiedAt` lần đầu. Dùng cho mỗi bài trong chuỗi Threads, Bài Facebook, Bình luận kèm link. Nguồn: D › Components › CopyButton; E › Component Patterns › CopyButton. FR-19, FR-22, AD-21.

UX-DR45: **ResearchProfileCard.** SuggestionCard `RESEARCH` ở Chi tiết Sản phẩm. Chưa có hồ sơ: chỉ nút "Nghiên cứu". Thân chia khu bằng tiêu đề `label-md`: Thông tin (mỗi ý kèm link nguồn `body-sm` `primary`), Mô tả ảnh, Khen / Chê / Phù hợp, Người đọc mục tiêu (AudiencePicker), Góc viết (AnglePicker). Dải `skipped` đầu thân: `Alert` nền `surface-container-high`, icon `info`, "AI chưa đọc được ảnh — hồ sơ chỉ dựa trên dữ liệu chữ" / "AI không tìm thêm được nguồn trên web"; vẫn Duyệt được. Cùng lần nghiên cứu sinh SuggestionCard `PRODUCT_CATEGORY` (Danh mục gợi ý) ngay dưới, Duyệt riêng → ghi Danh mục Sản phẩm; Vinh vẫn chọn tay Danh mục trên form; Tạo lại hồ sơ thay cả hồ sơ lẫn Danh mục gợi ý đang chờ. Nguồn: D › Components › ResearchProfileCard; E › Component Patterns › ResearchProfileCard, SuggestionCard; E › State Patterns › Hồ sơ nghiên cứu. FR-6, FR-7, AD-19.

UX-DR46: **AudiencePicker / AnglePicker.** `RadioGroup` dạng thẻ (`radiogroup` có nhãn nhóm): mỗi lựa chọn thẻ viền `outline-variant` `lg`, padding `space-md`, tên `label-md` + lý do/hook `body-sm` `on-surface-variant`; đã chọn: viền 2px `primary`, nền `primary-fixed`, chấm `primary`; dưới lựa chọn đang chọn có `Textarea` "Sửa lại (tuỳ chọn)". 1–3 Người đọc kèm lý do, ≥ 3 Góc viết kèm hook; chọn đúng một mỗi nhóm; Người đọc mặc định chọn nhóm đầu, Góc viết không chọn sẵn. Chọn được khi hồ sơ *Chờ duyệt* hoặc *Đã duyệt*. Bản sửa chỉ vào Bộ nội dung sắp tạo, không sửa hồ sơ; lựa chọn mất khi rời trang. Bộ nhiều Sản phẩm: liệt kê lựa chọn từ mọi hồ sơ, nhóm theo Sản phẩm. Nguồn: D › Components › AudiencePicker / AnglePicker; E › Component Patterns › AudiencePicker / AnglePicker; E › Accessibility Floor. FR-9, FR-10.

UX-DR47: **CreateContentSetPanel.** Khối cuối Chi tiết Sản phẩm, dưới ResearchProfileCard: "Sản phẩm trong bộ" (Sản phẩm hiện tại đầu tiên; dòng ảnh 40px + tên + StatusBadge hồ sơ), ProductPicker "Thêm Sản phẩm (bài Gom link)", PlatformToggle, nút "Tạo bộ nội dung" primary rộng hết khối. Mở từ Cảm hứng (`?cam-hung=<id>`): dải "Từ Cảm hứng: {ghi chú}" đầu khối, Bộ nội dung ghi liên kết Cảm hứng. Nút chỉ bật khi: mọi Sản phẩm có hồ sơ *Đã duyệt*, đã chọn một Góc viết và một Người đọc, ≥ 1 nền tảng. Khi tắt: `aria-disabled` + `aria-describedby`, dòng lý do `body-sm` dưới nút nêu điều kiện đầu tiên chưa đạt ("Duyệt Hồ sơ nghiên cứu trước" · "Chọn một Góc viết" · "Chọn ít nhất một nền tảng" · "'{tên}' chưa có hồ sơ đã duyệt" kèm link). Hồ sơ GENERATING → nút tắt, "Đang nghiên cứu…"; FAILED/REJECTED → picker ẩn, nút tắt, "Tạo lại Hồ sơ nghiên cứu". Tạo xong → chuyển `/cms/bo-noi-dung/[id]`. Nguồn: D › Components › CreateContentSetPanel; E › Component Patterns › CreateContentSetPanel; E › Accessibility Floor. FR-2, FR-12.

UX-DR48: **ProductPicker.** `Combobox` tìm Sản phẩm theo tên, chỉ Sản phẩm đang hiện; mỗi dòng đã chọn: ảnh 40px, tên, nút icon lên/xuống/gỡ (vùng bấm 44px); gỡ khỏi danh sách không xoá Sản phẩm. Dùng ở Soạn Bài web, CreateContentSetPanel, InspirationActions. Nguồn: D › Components › ProductPicker; E › Component Patterns › ProductPicker. FR-4.

UX-DR49: **BioProductList.** Danh sách `Card` mọi Sản phẩm đang hiện (Sản phẩm ẩn không có); mỗi dòng ảnh 40px, tên, `Switch` "Hiện trên bio" (mặc định bật cho Sản phẩm mới), nút Ghim (đang ghim nền `primary-fixed`), nút lên/xuống trong nhóm. Nhóm "Đang ghim" ở trên, ngăn hairline. Lưu từng thao tác ngay + Toast "Đã lưu". Nguồn: D › Components › BioProductList; E › Component Patterns › BioProductList; E › State Patterns › Trang bio (CMS). FR-31.

UX-DR50: **PostEditor.** Rich text tối giản; thanh công cụ dính trên ô soạn: H2, H3, đoạn, danh sách, trích dẫn (Callout), đậm, nghiêng — **không** link, ảnh, bảng; vùng soạn `body-lead` như trang public. Dán từ nơi khác → lọc qua `sanitizePostHtml` trước khi lưu. RiskWarning highlight câu ngay trong ô soạn. Nguồn: D › Components › PostEditor; E › Component Patterns › PostEditor. AD-22.

UX-DR51: **PlatformToggle.** Ba dòng `Checkbox` "Bài web / Threads / Facebook", mặc định chọn cả 3; dòng phụ "kèm Bình luận kèm link" `body-sm` dưới Threads và Facebook; bỏ hết → nút Tạo tắt. Nguồn: D › Components › PlatformToggle; E › Component Patterns › PlatformToggle. FR-12.

UX-DR52: **SeoCheckPanel.** Nút "Chấm SEO" → `Card` chỉ đọc: điểm `headline-lg` + danh sách gợi ý; không màu đỏ/xanh theo điểm; không lưu, không qua Duyệt. Nguồn: D › Components › SeoCheckPanel; E › Component Patterns › SeoCheckPanel. FR-13, AD-9.

UX-DR53: **PreviewSheet.** "Xem trước" mở `Sheet` toàn màn render đúng component trang public; nhãn "Bản xem trước" dính đỉnh nền `inverse-surface` chữ `inverse-on-surface`. Nguồn: D › Components › PreviewSheet; E › Component Patterns › PreviewSheet. AD-11.

UX-DR54: **UploadField.** `Input` file + `Progress`; vùng thả viền đứt `outline-variant`; ảnh xem trước đúng tỉ lệ đích. Chọn file từ máy hoặc dán URL ảnh (host cho phép); thanh tiến trình, huỷ được; video ≤ 100 MB; sai loại/quá cỡ/host không cho phép → lỗi tại trường, các trường khác giữ nguyên; Banner hiện tỉ lệ ảnh khuyến nghị dưới trường. Dùng ở Sản phẩm, Cảm hứng, Bài web, Banner. Nguồn: D › Components › UploadField; E › Component Patterns › UploadField; E › State Patterns › Upload. AD-24.

UX-DR55: **SocialFromPostDialog.** Ở Soạn Bài web, nút "Tạo bài mạng xã hội": Dialog chọn Threads / Facebook (mỗi nền tảng kèm Bình luận kèm link). Nền tảng đã có trong bộ hiện "Đã có", không chọn được. Bài thuộc Bộ nội dung → tạo vào bộ đó; chưa thuộc → tạo Bộ nội dung mới gắn Bài web + Sản phẩm của bài, dùng nội dung bài làm nguồn. Bài chưa gắn Sản phẩm: nút tắt + lý do "Gắn ít nhất một Sản phẩm để có Link affiliate cho Bình luận". Xác nhận → chuyển `/cms/bo-noi-dung/[id]`, thẻ mới ở Đang tạo. Nguồn: D › Components › Dialog nhóm; E › Component Patterns › SocialFromPostDialog. FR-16.

UX-DR56: **MarkPostedDialog.** Nút "Đánh dấu đã đăng" (bài Threads/Facebook trong Bộ nội dung) → Dialog có ô link bài đăng (tuỳ chọn, kiểm URL). Lưu → badge "Đã đăng · dd/mm/yyyy" + link mở bài; bỏ đánh dấu được. Nguồn: D › Components › Dialog nhóm; E › Component Patterns › MarkPostedDialog. FR-20.

UX-DR57: **RegenerateDialog.** Mọi SuggestionCard trừ Danh mục gợi ý: ô chỉ dẫn ngắn (tuỳ chọn) + chip mẫu "ngắn hơn", "vui hơn", "bỏ phần giá" (token `chip`). Xác nhận → gợi ý cũ thành SUPERSEDED, thẻ chuyển GENERATING. Nguồn: D › Components › Dialog nhóm; E › Component Patterns › RegenerateDialog. FR-21.

UX-DR58: **ConfirmDialog.** `AlertDialog` cho mọi thao tác xoá và chuyển bài về nháp: tiêu đề nêu đối tượng ("Xoá bài '…'?"), hậu quả một câu, nút "Xoá" `destructive` + "Huỷ" (focus mặc định vào Huỷ). Ẩn Sản phẩm **không** cần xác nhận — một thao tác + Toast có nút "Hoàn tác". Nguồn: D › Components › Dialog nhóm; E › Component Patterns › ConfirmDialog. FR-5.

UX-DR59: **UnsavedChangesGuard.** Mọi form CMS có thay đổi chưa lưu: rời trang (link trong app hoặc đóng tab) → hộp xác nhận "Bạn có thay đổi chưa lưu. Rời trang?". Nguồn: D › Components › Dialog nhóm; E › Component Patterns › UnsavedChangesGuard. AD-14.

UX-DR60: **CmsForm.** `Field`, `Input`, `Sonner`: lỗi validate tại trường (`error`, `body-sm`, dưới trường), phía client, cùng schema server; lỗi server → Toast; nút Lưu tắt + spinner khi đang gửi, dính đáy trên mobile; dữ liệu đã nhập không mất khi lỗi; mất mạng / Basic Auth hỏi lại → giữ dữ liệu, Toast "Chưa gửi được, kiểm tra mạng rồi thử lại", nút Lưu bật lại. Nguồn: D › Components › CmsForm; E › Component Patterns › CmsForm; E › State Patterns › CMS. NFR-2, AD-14.

UX-DR61: **InspirationActions.** Ở `/cms/cam-hung/[id]`: "Gắn sản phẩm" mở Sheet hai lựa chọn — "Tạo Sản phẩm mới" → màn tạo Sản phẩm kèm `?cam-hung=<id>`, hoặc "Chọn Sản phẩm có sẵn" (ProductPicker) → `/cms/san-pham/[id]?cam-hung=<id>`. "Bỏ qua" đặt *Bỏ qua* một chạm + Toast "Hoàn tác"; Cảm hứng *Bỏ qua* có nút "Đưa lại vào Mới". Liên kết chỉ ghi khi tạo Bộ nội dung (*Đã dùng* suy ra từ `ContentSet`). Nguồn: E › Component Patterns › InspirationActions (D không có đặc tả hình riêng). FR-1, FR-2.

#### D. Bề mặt site public

UX-DR62: **Trang chủ `/`.** Thứ tự khu (mobile): Banner → Bài nổi bật (Bài web xuất bản mới nhất, PostCard *featured*) → Gom link đồ xinh (dải ProductCard *tile* cuộn ngang, nguồn Sản phẩm đang hiện trên bio theo thứ tự ghim/sắp xếp, tối đa 8, dòng AffiliateDisclosure ngắn dưới tiêu đề, "Xem tất cả" → `/bio`) → Xem nhiều (PostCard *rank* `01`–`05`, không "Xem tất cả") → Mới cập nhật (bỏ Bài nổi bật để không trùng; cuối khu link "Mẹo vặt" → `/meo-vat`, "Gom link" → `/gom-link`) → Mẹo vặt hay (dạng dòng, "Xem tất cả" → `/meo-vat`). Tablet: PostCard grid 2 cột. Desktop: Bài nổi bật (7 cột) + Xem nhiều (5 cột) cạnh nhau, rồi Gom link đồ xinh lưới 4 cột, Mới cập nhật 3 cột. Trạng thái: 0 Banner → bỏ khối, Bài nổi bật lên đầu; Xem nhiều < 5 bài hiện số có, 0 thì ẩn; khối Loại bài / dải Gom link rỗng → ẩn. Nguồn: E › IA › Site public, Khu Trang chủ; E › Responsive & Platform; E › State Patterns › Trang chủ; E › Giả định đã chốt (Q8). FR-32, FR-34.

UX-DR63: **Bài viết `/bai-viet/[slug]`.** Khu bắt buộc theo thứ tự: Breadcrumb → PostTypeBadge + H1 + ngày · phút đọc → AffiliateDisclosure (nếu có Sản phẩm) → ảnh đầu bài 16:9 (không carousel) → TableOfContents → ArticleBody → khối Sản phẩm (danh sách dọc ProductCard *row*, > 5 vẫn hiện hết) → PostTags → LikeButton + ShareButtons cuối bài → RelatedPosts. Mobile: ArticleActionBar thay BottomTabBar. Desktop: thân 8 cột + cột phải dính (TOC, tim, chia sẻ). Trạng thái: không Sản phẩm → ẩn AffiliateDisclosure, khối Sản phẩm, nút "Sản phẩm"; slug cũ → chuyển hướng vĩnh viễn sang slug mới. Nguồn: E › IA › Site public; D › Layout & Spacing; E › Component Patterns (AffiliateDisclosure, ArticleActionBar…); E › State Patterns › Bài viết; E › Key Flows UJ-4. FR-24–26, FR-35, FR-37, AD-20.

UX-DR64: **Danh mục `/[danh-muc]`, `/[danh-muc]/trang/[n]`.** Breadcrumb, mô tả Danh mục, lưới Bài web (PostCard), Pagination; BottomTabBar chọn tab "Danh mục". Rỗng → EmptyState "Danh mục này chưa có bài nào" + link Trang chủ; trang n vượt quá → 404. Không có mockup (spine-only). Nguồn: E › IA › Site public; E › State Patterns › Danh mục / Loại bài. FR-29.

UX-DR65: **Loại bài `/meo-vat`, `/gom-link` (+ `/trang/[n]`).** Như trang Danh mục nhưng lọc theo Loại bài; tab "Mẹo vặt"/"Gom link" được chọn kể cả ở `/trang/n`; Pagination, rỗng, vượt trang như UX-DR64. Nguồn: E › IA › Site public; E › Component Patterns › BottomTabBar, Pagination. FR-28, AD-7.

UX-DR66: **Trang bio `/bio`.** Một cột ProductCard *row*; desktop căn giữa rộng tối đa 560px. Thứ tự: (1) Giới thiệu từ CMS + link "Về trang chủ" (link tuỳ chỉnh duy nhất); (2) AffiliateDisclosure luôn hiện, không đóng được; (3) FilterChips; (4a) chip "Tất cả": nhóm "Nổi bật" (Sản phẩm ghim, theo thứ tự bio) trước, rồi mỗi Danh mục một nhóm theo thứ tự hiển thị với tiêu đề `headline-sm` + số món, Sản phẩm ghim không lặp ở nhóm Danh mục; (4b) chip một Danh mục: danh sách phẳng, ghim lên đầu, giữ dấu Ghim. Không ô tìm, không bộ sưu tập ảo, không emoji, không link MXH/@handle, không khối "Bài mới nhất". Rỗng: vẫn hiện giới thiệu + AffiliateDisclosure + link Trang chủ, EmptyState "Sắp có đồ hay, ghé lại sau nhé". Nguồn: E › IA › Bố cục `/bio`; E › Responsive & Platform; E › State Patterns › `/bio`; E › Giả định đã chốt (Q4, Q10); D › Do's and Don'ts. FR-30, FR-31.

UX-DR67: **Tìm kiếm `/tim-kiem` (noindex).** SearchBox tự focus (khi đến từ nút header). Chưa gõ: SearchBox + FilterChips Danh mục (thay "Gợi ý từ khoá" Stitch). Đang tìm: 3 Skeleton dòng dưới ô, kết quả cũ mờ đi nếu có. Có kết quả: "Tìm thấy N bài viết cho "…"" + SearchResultItem. Không kết quả: EmptyState "Chưa tìm thấy mẹo nào phù hợp với từ khoá này rồi..." + gợi ý gõ ngắn hơn + "Chủ đề được đọc nhiều nhất" (Xem nhiều). Lỗi: "Chưa tìm được lúc này, thử lại nhé" + nút Thử lại. Kết quả lấy phía client; chỉ Bài web. Nguồn: E › IA › Site public; E › State Patterns › Tìm kiếm; E › Voice and Tone; E › Foundation. FR-36.

UX-DR68: **404.** Mọi đường dẫn không có: EmptyState "Trang này không còn ở đây" + SearchBox + 3 bài Xem nhiều (PostCard). Nguồn: E › IA › Site public; E › State Patterns › 404.

UX-DR69: **Trang lỗi `error.tsx`.** EmptyState "Trang đang trục trặc một chút" + nút "Thử lại" + link Trang chủ; không lộ chi tiết nội bộ. Nguồn: E › IA › Site public; E › State Patterns › Mọi trang. AD-12, AD-13.

#### E. Bề mặt CMS

UX-DR70: **Gốc CMS `/cms`.** Chuyển thẳng tới `/cms/bai-viet` (sau này thành dashboard, chưa thiết kế). Đăng nhập là hộp thoại Basic Auth của trình duyệt — không có màn đăng nhập. Nguồn: E › IA › CMS; E › Foundation.

UX-DR71: **Danh sách Bài web `/cms/bai-viet`.** DataList, lọc trạng thái (Nháp/Đã xuất bản), cột Lượt xem/Lượt tim, sắp xếp; tham số trên URL. Nguồn: E › IA › CMS. FR-27, FR-38.

UX-DR72: **Soạn / sửa Bài web `/cms/bai-viet/moi`, `/cms/bai-viet/[id]`.** CmsForm gồm PostEditor, trường SEO, ảnh đại diện (UploadField), ProductPicker, SeoCheckPanel ("Chấm SEO"), PreviewSheet ("Xem trước"), Xuất bản; link "← Bộ nội dung" khi bài thuộc Bộ nội dung; nút "Tạo bài mạng xã hội" (SocialFromPostDialog); UnsavedChangesGuard. Bài có gợi ý AI Đang tạo / Chờ duyệt: nút "Xuất bản" tắt + lý do "Cần duyệt bài AI trước khi xuất bản" + link về Bộ nội dung (khoá chỉ ở giao diện). Chuyển bài về nháp qua ConfirmDialog. `/moi` có khối "Nhập từ URL" (FR-39) và form nhập/`/[id]` có "AI chỉnh sửa" (FR-40): kết quả điền form chưa lưu, UnsavedChangesGuard bắt như sửa tay (thêm 2026-11-09). Nguồn: E › IA › CMS; E › State Patterns › Soạn Bài web; E › Component Patterns. FR-4, FR-13, FR-16, FR-22, FR-27, FR-39, FR-40, AD-19.

UX-DR73: **Danh sách Sản phẩm `/cms/san-pham`.** DataList, tìm theo tên, StatusBadge Hiện/Ẩn, hiện đã đăng nền tảng nào; nút "Tạo Sản phẩm". Nguồn: E › IA › CMS; E › Key Flows UJ-1, Flow 5. FR-3, FR-5, FR-20.

UX-DR74: **Chi tiết Sản phẩm `/cms/san-pham/[id]` (cũng là màn tạo mới).** Form (tên, Link affiliate, giá tham khảo, Danh mục chọn tay…), Dữ liệu thô, UploadField, ResearchProfileCard (+ Danh mục gợi ý), CreateContentSetPanel, "nơi đang dùng". Lưu → ở lại màn. "Ẩn" một chạm → StatusBadge "Ẩn" + Toast "Hoàn tác" + danh sách Bài web và Bộ nội dung đang dùng (mỗi mục là link). Link affiliate sai domain → lỗi tại trường "Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)". Nhận `?cam-hung=<id>`. Nguồn: E › IA › CMS; E › State Patterns › Sản phẩm; E › Key Flows UJ-1, Flow 5. FR-3, FR-5–FR-12.

UX-DR75: **Bộ nội dung `/cms/bo-noi-dung/[id]`.** Một cột xếp chồng, không tab (mobile 360px; desktop rộng tối đa 768px căn giữa). Số thẻ: 1 SuggestionCard mỗi nền tảng đã chọn + 1 Bình luận kèm link cho mỗi nền tảng MXH đã chọn (đủ 3 = 5 thẻ; chỉ Threads = 2; chỉ Bài web = 1); Bình luận nằm ngay dưới bài cùng nền tảng. Vùng: (1) đầu màn không dính: "Bộ nội dung" + Sản phẩm (ảnh 40px + tên, link `/cms/san-pham/[id]`), Góc viết + hook, Người đọc, link Cảm hứng nếu có, tiến độ "3/5 đã duyệt", link "Mở bài web" khi Bài web đã có; (2) thanh nhảy dính dưới CmsShell: chip theo nền tảng có trong bộ, mỗi chip có chấm màu StatusBadge, chạm cuộn tới khối; (3) Bài web: đã Duyệt → Post nháp được tạo, thẻ chỉ đọc (tiêu đề + tóm tắt) + "Mở bài web"; (4) Threads: chuỗi → Bình luận → hàng "Đánh dấu đã đăng" / badge "Đã đăng · dd/mm/yyyy" + link; (5) Facebook: tương tự; (6) nền tảng chưa có: dòng "Thêm Bài {nền tảng}" tạo Gợi ý mới vào cùng bộ. Duyệt/Từ chối/Tạo lại ở chân từng thẻ, không "Duyệt tất cả". Nguồn: E › IA › Màn Bộ nội dung; E › Key Flows UJ-1. FR-12–FR-23, NFR-4, AD-19.

UX-DR76: **Cảm hứng — danh sách `/cms/cam-hung`.** DataList lọc Mới / Đã dùng / Bỏ qua; "Lưu cảm hứng" tạo nhanh: dán link video + một dòng ghi chú, Lưu — dưới 3 lần chạm sau khi dán. Nguồn: E › IA › CMS; E › Key Flows UJ-2. FR-1, FR-2.

UX-DR77: **Cảm hứng — chi tiết `/cms/cam-hung/[id]`.** Nút "Nghiên cứu" → SuggestionCard từ khoá Shopee + dàn ý bài mẹo (chờ duyệt); InspirationActions ("Gắn sản phẩm", "Bỏ qua", "Đưa lại vào Mới"); sau khi tạo Bộ nội dung tự chuyển *Đã dùng* và hiện link tới Bộ nội dung. Không đọc được video → thông báo rõ, gợi ý tải file video lên; AI vẫn làm với tiêu đề và ghi chú. Nguồn: E › IA › CMS; E › State Patterns › Cảm hứng; E › Key Flows UJ-2. FR-1, FR-2.

UX-DR78: **Danh mục `/cms/danh-muc`.** CRUD, sắp thứ tự (nút lên/xuống). Xoá khi còn bài/sản phẩm → Toast lỗi nêu số Bài web và Sản phẩm còn lại, gợi ý chuyển Danh mục trước; slug trùng đường dẫn hệ thống → lỗi tại trường "Đường dẫn này đã dành cho hệ thống". Xoá qua ConfirmDialog. Nguồn: E › IA › CMS; E › State Patterns › Danh mục. FR-28.

UX-DR79: **Banner `/cms/banner`.** CRUD, bật/tắt, lịch, UploadField có tỉ lệ ảnh khuyến nghị; StatusBadge Tắt / Chờ lịch / Hết hạn / Đang hiện; chỉ "Đang hiện" lên site. Nguồn: E › IA › CMS; E › State Patterns › Banner. FR-32.

UX-DR80: **Trang bio (CMS) `/cms/bio`.** Ô giới thiệu, câu chữ nhãn (câu công khai), BioProductList (chọn / ghim / sắp xếp); Sản phẩm ẩn không có trong danh sách. Nguồn: E › IA › CMS; E › State Patterns › Trang bio (CMS). FR-31.

UX-DR81: **Hồ sơ phong cách `/cms/phong-cach`.** Ba phần Website / Threads / Facebook; giá trị vượt giới hạn cứng → lỗi tại trường nêu giới hạn; lưu xong Toast "Đã lưu — áp dụng cho nội dung tạo từ giờ". Nguồn: E › IA › CMS; E › State Patterns › Hồ sơ phong cách. FR-18, AD-25.

UX-DR82: **Styleguide `/cms/styleguide` (noindex).** Màn chỉ để phát triển, xem token (màu light/dark, typography, rounded, spacing, elevation) và component; nằm trong menu CmsShell, noindex. Nguồn: E › IA › CMS. AD-17. (D không mô tả nội dung cụ thể; danh sách token/component lấy theo D.)

#### F. State Patterns chung

UX-DR83: **Trạng thái chung site public.** Đang tải: Skeleton cùng bố cục trong `<Suspense>`; lỗi: `error.tsx` (UX-DR69); ngoại tuyến: không xử lý riêng; ảnh ngoài lỗi: ImageFallback, thẻ vẫn bấm được; Sản phẩm vừa ẩn biến mất khỏi site/`/bio` trong khoảng 1 phút, không có trạng thái lỗi hiển thị. Lượt xem, Lượt tim, kết quả tìm kiếm lấy phía client; không đọc `searchParams` ở server. Nguồn: E › State Patterns › Site public; E › Foundation; E › Key Flows UJ-3. NFR-5, AD-7, AD-12.

UX-DR84: **Trạng thái chung CMS.** Đang tải: Skeleton shadcn trong `<Suspense>`; không tìm thấy bản ghi: `notFound()` → "Không tìm thấy. Có thể đã bị xoá." + link về danh sách; danh sách rỗng / lọc không ra (UX-DR39); lỗi AI/server: Toast tiếng Việt, dữ liệu giữ nguyên; mất mạng / Basic Auth hỏi lại (UX-DR60); upload đang tải / lỗi (UX-DR54); Gợi ý AI theo 5 trạng thái (UX-DR41). Nguồn: E › State Patterns › CMS. NFR-2.

#### G. Interaction Primitives

UX-DR85: **Thao tác được phép.** Chạm/bấm với vùng bấm ≥ 44px; cuộn ngang có chủ đích **chỉ** ở dải Banner, dải Gom link đồ xinh, FilterChips, thanh nhảy Bộ nội dung (snap theo thẻ, không thanh cuộn; trang không bao giờ cuộn ngang); cuộn mượt tới neo (mục lục, "Sản phẩm", thanh nhảy, mục RiskWarning) — tắt khi reduced-motion; hover desktop (ảnh PostCard phóng 3–5%, tiêu đề `primary`), không hành động chỉ xuất hiện khi hover; tim nảy ≤ 200ms; Sheet/Dialog chồng tối đa một lớp, đóng bằng Esc / chạm nền / vuốt xuống (Sheet). CMS: không kéo-thả, sắp bằng lên/xuống, không phím tắt riêng. Nguồn: E › Interaction Primitives.

UX-DR86: **Thao tác bị cấm.** Cuộn vô hạn / "Xem thêm" tải tiếp, carousel tự chạy, popup chào mừng, đếm ngược, nhấp nháy, nút đổi theme tay, hành động ẩn sau long-press. Nguồn: E › Interaction Primitives (Cấm); E › Inspiration & Anti-patterns; D › Brand & Style. AD-7.

#### H. Accessibility Floor (mục tiêu WCAG 2.2 AA)

UX-DR87: **Cấu trúc trang.** `lang="vi"`; mỗi trang một `h1`, h2 thân bài theo thứ tự; link "Bỏ qua tới nội dung" đầu trang; ảnh có `alt` (ảnh Sản phẩm ngoài ProductCard = tên Sản phẩm; ảnh đại diện = tiêu đề bài nếu CMS không nhập alt); zoom 200% không vỡ bố cục; không chặn zoom (bỏ `user-scalable=no` của Stitch). Nguồn: E › Accessibility Floor.

UX-DR88: **Focus và bàn phím.** Vòng focus 2px `primary` cách 2px, chỉ hiện với `:focus-visible`; thứ tự Tab theo thứ tự đọc; thanh dính không che phần tử đang focus (`scroll-padding`); Sheet/Dialog bẫy focus, Esc đóng, trả focus về nút mở. Vòng focus đạt ≥ 3:1 (6.3:1 light, 5.0:1 dark). Nguồn: E › Accessibility Floor; D › Colors (bảng tương phản).

UX-DR89: **ARIA và vùng live.** Mọi nút chỉ có icon có `aria-label` tiếng Việt ("Thả tim bài viết", "Chia sẻ lên Threads", "Sao chép link", "Tìm kiếm"); LikeButton `aria-pressed` + số trong nhãn; BottomTabBar `nav aria-label="Điều hướng chính"` + `aria-current="page"`; `aria-live="polite"` cho Toast, "Tìm thấy N bài viết", GeneratingIndicator, bộ đếm Threads khi vượt; AudiencePicker/AnglePicker là `radiogroup` có nhãn nhóm; nút "Tạo bộ nội dung" tắt dùng `aria-disabled` + `aria-describedby` (không `disabled` cứng). Nguồn: E › Accessibility Floor.

UX-DR90: **Link đơn và ngoại lệ tương phản.** ProductCard (và Banner trỏ Shopee) là một `<a>` duy nhất, không phần tử bấm lồng, tên truy cập tên → giá → "Xem trên Shopee" + "mở Shopee trong tab mới", ảnh `alt=""`, dấu Ghim chữ ẩn "Nổi bật"; PostCard *rank* dùng `<ol>`, số `aria-hidden`. Nguồn: E › Accessibility Floor; D › Colors.

UX-DR91: **Reduced motion.** Tôn trọng `prefers-reduced-motion` cho cuộn mượt, hover phóng ảnh, hiệu ứng tim, Banner, icon "Đang tạo", nhấp nháy Skeleton. Nguồn: E › Accessibility Floor; E › Component Patterns › Skeleton; D › Components › StatusBadge.

UX-DR92: **Vùng bấm 44px.** Mọi vùng bấm ≥ 44px kể cả khi hình nhỏ hơn (chip, nút Shopee 36px dùng `::before`); CMS mobile nâng Button/Input/Checkbox/Radio lên 44px; khoảng giữa hai phần tử nới vùng ≥ 8px. Nguồn: E › Interaction Primitives; D › Layout & Spacing; D › Components › CMS; D › Do's and Don'ts.

#### I. Responsive & Platform

UX-DR93: **Breakpoint site public.** < 768px: một cột, BottomTabBar, TOC thu gọn được ở đầu bài, ArticleActionBar; 768–1023px: lưới 6 cột, PostCard grid 2 cột, vẫn BottomTabBar; ≥ 1024px: nav ngang, không BottomTabBar, Trang chủ bố cục desktop (UX-DR62), Bài viết 8 + 4 cột dính; `/bio` cột ≤ 560px căn giữa. Màn chưa có mockup desktop/tablet/dark (Danh mục, Bio, Tìm kiếm) dựng theo bảng này + token `-dark`. Kiểm ở 360px và 390px. Nguồn: E › Responsive & Platform; D › Layout & Spacing.

UX-DR94: **CMS mobile-first.** Mọi luồng UJ-1, UJ-2 làm trọn trên điện thoại 360px; desktop thêm sidebar và `Table`; Bộ nội dung giữ một cột ≤ 768px. Nguồn: E › Responsive & Platform; E › Foundation. NFR-4.

#### J. Voice and Tone & định dạng

UX-DR95: **Microcopy bắt buộc — site public.** Xưng "mình"/"bạn", gần gũi. Câu công khai mặc định trên bài: "Minh bạch liên kết: Bài viết có link tiếp thị liên kết Shopee. Bạn mua qua link, mình nhận một khoản hoa hồng nhỏ để duy trì trang web, giá bạn trả hoàn toàn không đổi."; giá: "Giá tham khảo ~89.000đ · cập nhật 12/10/2026"; nút: "Xem trên Shopee"; tìm không ra: "Chưa tìm thấy mẹo nào phù hợp với từ khoá này rồi..." + gợi ý gõ ngắn hơn; sao chép: "Đã sao chép liên kết"; các câu trạng thái ở UX-DR25, 26, 64, 66–69. Nguồn: E › Voice and Tone; E › State Patterns.

UX-DR96: **Microcopy bắt buộc — CMS.** Ngắn, rõ, trung tính: "Đang viết bài Threads…", "Đã duyệt", "Tạo lại", "Đã lưu"; lỗi AI: "Chưa tạo được bài Facebook. Phần khác vẫn giữ nguyên. Bấm Tạo lại."; lỗi bất ngờ: "Có lỗi xảy ra, thử lại sau"; không lỗi tiếng Anh, mã lỗi, stack trace, không lộ chi tiết nội bộ. Nguồn: E › Voice and Tone. AD-13.

UX-DR97: **Từ ngữ cấm.** "Ưu đãi sốc!", "Mua ngay kẻo hết", "SALE SỐC", "Chỉ 89.000đ", "Mua ngay", "Chốt đơn", "No results", "Copied!", "Processing request…", "Lưu thành công ✓", "cập nhật hôm qua"; không dùng "đã test", "đã kiểm chứng", "tự mua". Nguồn: E › Voice and Tone; D › Brand & Style. R-8, FR-23.

UX-DR98: **Định dạng ngày/số vi-VN.** Chỉ tiếng Việt có dấu; số và ngày qua `formatDate`/`formatCount`; thời gian tương đối chỉ tính phía client; ngày cập nhật giá luôn tuyệt đối "cập nhật dd/mm/yyyy" ở mọi nơi; badge "Đã đăng · dd/mm/yyyy". Nguồn: E › Foundation; D › Do's and Don'ts. FR-3, AD-27.

#### K. Phạm vi loại trừ

UX-DR99: **Phần Stitch bị loại (không dựng lại khi chưa sửa PRD).** avatar/tài khoản; newsletter; nút "Lưu"/bookmark và "lượt lưu"; tác giả; huy hiệu "đã kiểm chứng" (và Top Pick / Best Seller / Organic / Shopee Mall / Đã test 6 tháng); giá gạch, % giảm; sao; danh mục con, nhãn phụ, breadcrumb 3 cấp; lọc theo giá; bộ sưu tập ảo; link MXH và @handle ở bio; khối "Bài mới nhất" trên bio; tab "Shopee" trong tìm kiếm; công tắc demo; nút "Thử tông trầm"; footer trang tĩnh; carousel ảnh đầu bài; khối sản phẩm ngoài bài ("Góc sắm sửa tin cậy"). Kiểm được: không màn nào có các phần này. Nguồn: D › Do's and Don'ts (danh sách chuẩn); E › Inspiration & Anti-patterns.

#### Hành trình chính (UX)

- **UJ-1 — Vinh biến một món đồ trên Shopee thành bộ nội dung 3 nền tảng** (Vinh, CMS trên điện thoại). Cao trào: tại `/cms/bo-noi-dung/[id]` từng thẻ lần lượt hiện nội dung trên cùng một màn; Vinh chạm RiskWarning để highlight câu chưa có căn cứ, sửa và Duyệt Bài web, Xuất bản qua Soạn Bài web, rồi CopyButton từng bài Threads và Bình luận — mỗi lần một chạm. Lỗi: thiếu nguồn web, Facebook FAILED, sao chép trước khi Duyệt, hồ sơ FAILED.
- **UJ-2 — Vinh đi từ một video mẹo trên TikTok đến sản phẩm** (Vinh). Cao trào: sau khi tạo Bộ nội dung, Cảm hứng tự chuyển *Đã dùng* và hiện link tới Bộ nội dung. Lỗi: không đọc được video.
- **UJ-3 — Người đọc từ Threads mua hàng** (người đọc lướt Threads, chưa đặt tên). Cao trào: chạm ProductCard có "Giá tham khảo · cập nhật 12/10/2026" trên `/bio` → Shopee mở tab mới, `/bio` còn ở tab cũ. Lỗi: Sản phẩm đã ẩn biến mất trong ~1 phút.
- **UJ-4 — Người đọc từ Google khám phá website** (người tìm "mẹo tẩy ố nồi chiên không dầu"). Cao trào: quay về bài đầu, chạm "Sản phẩm" trên ArticleActionBar, đọc giá có ngày cạnh nhãn minh bạch, chạm ProductCard — mua vì trang không giấu hoa hồng. Lỗi: tìm không ra, tim bị giới hạn.
- **Flow 5 — Vinh ẩn một Sản phẩm vi phạm** (Vinh; FR-5, R-2). Cao trào: màn hiện danh sách Bài web và Bộ nội dung đang dùng Sản phẩm, mỗi mục là link; site và `/bio` gỡ trong ~1 phút.
- **Flow 6 — Bài Gom link nhiều Sản phẩm** (Vinh; PRD §4.3, FR-4, FR-12). Cao trào: "Tạo bộ nội dung" ra Bộ nội dung 3 Sản phẩm; Bình luận kèm link chứa Link affiliate của cả 3 (FR-17). Lỗi: món chưa có hồ sơ đã duyệt.
- **Flow 7 — Từ Bài web có sẵn tạo bài mạng xã hội** (Vinh; FR-16). Cao trào: chuyển tới `/cms/bo-noi-dung/[id]`, Bài Threads + Bình luận ở Đang tạo, Bài web hiện sẵn. Lỗi: bài chưa gắn Sản phẩm.

### FR Coverage Map

Giai đoạn theo PRD §8: GĐ1 = Epic 1–7; GĐ1.5 = Epic 8–11.

FR-1: Epic 10 - Lưu Cảm hứng
FR-2: Epic 10 - Biến Cảm hứng thành bài
FR-3: Epic 2 - Tạo/sửa Sản phẩm, Link affiliate Shopee, ảnh
FR-4: Epic 3 - Gắn nhiều Sản phẩm vào Bài web
FR-5: Epic 2 - Ẩn Sản phẩm
FR-6: Epic 4 - AI tìm thông tin trên web
FR-7: Epic 4 - AI đọc ảnh
FR-8: Epic 4 - Tóm tắt đánh giá
FR-9: Epic 4 - Người đọc mục tiêu
FR-10: Epic 4 - Góc viết
FR-11: Epic 4 - Gợi ý Danh mục (Sản phẩm); Epic 5 - Danh mục và Loại bài cho Bài web
FR-12: Epic 5 - Tạo Bộ nội dung một lần
FR-13: Epic 5 - Tạo Bài web
FR-14: Epic 5 - Bài Threads
FR-15: Epic 5 - Bài Facebook
FR-16: Epic 5 - Bài web → Bài mạng xã hội
FR-17: Epic 5 - Bình luận kèm link
FR-18: Epic 5 - Hồ sơ phong cách
FR-19: Epic 5 - Copy nhanh
FR-20: Epic 5 - Đánh dấu đã đăng
FR-21: Epic 4 - Tạo lại có chỉ dẫn (lõi); Epic 5 - áp cho mọi kind nội dung
FR-22: Epic 4 - Duyệt (lõi, hồ sơ, Danh mục gợi ý); Epic 5 - Duyệt nội dung, khoá Xuất bản, cảnh báo copy chưa Duyệt
FR-23: Epic 5 - Cảnh báo rủi ro
FR-24: Epic 2 - Nhãn công khai affiliate (AffiliateDisclosure)
FR-25: Epic 2 - Quy tắc link affiliate (AffiliateLink)
FR-26: Epic 3 - Trang bài viết
FR-27: Epic 3 - Quản lý Bài web, slug 301
FR-28: Epic 2 - Quản lý Danh mục
FR-29: Epic 2 - Trang Danh mục public
FR-30: Epic 6 - Trang bio public
FR-31: Epic 6 - Quản lý Trang bio
FR-32: Epic 9 - Banner
FR-33: Epic 7 - Đếm Lượt xem
FR-34: Epic 8 - Xem nhiều
FR-35: Epic 8 - Thả tim
FR-36: Epic 8 - Tìm kiếm
FR-37: Epic 8 - Chia sẻ
FR-38: Epic 7 - Thống kê trong CMS (Lượt tim bổ sung ở Epic 8)
FR-39: Epic 11 - Nhập Bài web từ URL
FR-40: Epic 11 - AI chỉnh sửa trong trình soạn

NFR: NFR-6, NFR-10 → Epic 1; NFR-5, NFR-8, NFR-11 → Epic 3; NFR-1, NFR-2, NFR-3, NFR-9 → Epic 4; NFR-4 → Epic 5 (kiểm lại ở mọi epic CMS); NFR-7 → Epic 7, Epic 8.

## Epic List

### Epic 1: Epic nền — site cũ chạy trên cấu trúc mới
Website và CMS vẫn chạy như hiện tại, nhưng code mới có chỗ đúng (`modules/`, `platform/`), có Vitest, ESLint chặn import sai tầng, database đã có Danh mục và Sản phẩm dùng chung. Làm đúng 4 bước AD-17 theo thứ tự; bước 3 (migration nền) đúng một story. Mọi epic sau phụ thuộc epic này.
**FRs covered:** — (NFR-6, NFR-10; AD-17)

### Epic 2: Kho Sản phẩm và Danh mục
Vinh tạo, sửa, ẩn Sản phẩm dùng chung với Link affiliate Shopee hợp lệ, quản lý Danh mục; người đọc xem trang Danh mục có phân trang; mọi link Shopee qua `AffiliateLink` kèm nhãn công khai. Story upload ảnh để cuối, chặn bởi Deferred "backend lưu file"; trước đó dán URL ảnh.
**FRs covered:** FR-3, FR-5, FR-24, FR-25, FR-28, FR-29

### Epic 3: Bài web hoàn chỉnh — đọc và quản lý
Vinh soạn, gắn nhiều Sản phẩm, xem trước, xuất bản, đổi slug (link cũ chuyển hướng 308). Người đọc có Trang chủ, trang bài (mục lục, bài liên quan, breadcrumb), trang Loại bài có phân trang, 404, SEO đầy đủ.
**FRs covered:** FR-4, FR-26, FR-27 (NFR-5, NFR-8, NFR-11)

### Epic 4: Nghiên cứu Sản phẩm bằng AI
Vinh bấm "Nghiên cứu": AI tìm web, đọc ảnh, tóm tắt đánh giá, gợi ý Người đọc mục tiêu, Góc viết, Danh mục; Vinh Duyệt hoặc Tạo lại; chạy nền, rời màn quay lại vẫn thấy. Dựng lõi gợi ý AI (`platform/ai`, `Suggestion`, SuggestionCard, poller, Duyệt/Tạo lại) mà Epic 5 mở rộng. Chặn bởi Deferred "nhà cung cấp AI" trước story đầu tiên.
**FRs covered:** FR-6, FR-7, FR-8, FR-9, FR-10, FR-11 (Sản phẩm), FR-21 (lõi), FR-22 (lõi) (NFR-1, NFR-2, NFR-3, NFR-9)

### Epic 5: Xưởng Bộ nội dung
Từ hồ sơ đã Duyệt, Vinh tạo một lần Bài web, Bài Threads, Bài Facebook và Bình luận kèm link; xem Cảnh báo rủi ro, Duyệt từng phần, copy một chạm, đánh dấu đã đăng; chuyển Bài web có sẵn thành bài mạng xã hội; sửa Hồ sơ phong cách. Cao trào UJ-1, làm được trên điện thoại.
**FRs covered:** FR-11 (Bài web), FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-21, FR-22, FR-23 (NFR-4)

### Epic 6: Trang bio
Người đọc từ Threads/Facebook vào `/bio`, lọc theo Danh mục và mua; Vinh chọn món hiện, ghim, sắp thứ tự. Xong epic này UJ-1 trọn (Sản phẩm tự lên `/bio`).
**FRs covered:** FR-30, FR-31

### Epic 7: Đo Lượt xem
Mỗi Bài web đếm Lượt xem ẩn danh (không đếm Vinh, không đếm bot); danh sách bài CMS hiện và sắp xếp theo Lượt xem.
**FRs covered:** FR-33, FR-38 (NFR-7)

### Epic 8: Người đọc tương tác (GĐ1.5)
Người đọc thả tim, tìm kiếm không dấu, chia sẻ bài; Trang chủ có khu Xem nhiều; CMS thêm cột Lượt tim. Cần Epic 7 cho FR-34.
**FRs covered:** FR-34, FR-35, FR-36, FR-37

### Epic 9: Banner khuyến mãi (GĐ1.5)
Vinh đặt Banner có lịch (dịp 11.11); site chỉ hiện Banner đang bật và trong khung giờ. Chặn bởi Deferred "backend lưu file".
**FRs covered:** FR-32

### Epic 10: Kho Cảm hứng (GĐ1.5)
Vinh lưu video/link mẹo ban ngày; tối AI gợi ý từ khoá Shopee và dàn ý; gắn Sản phẩm rồi đi tiếp như UJ-1. Chặn bởi Deferred "backend lưu file" và "cách đọc video". Cần Epic 4, 5.
**FRs covered:** FR-1, FR-2

### Epic 11: Nhập Bài web từ URL (GĐ1.5)
Vinh dán URL một bài bên ngoài ở màn Tạo Bài web, AI điền sẵn nội dung vào form, rồi Vinh sửa tay hoặc nhờ AI viết lại thành bài mới; chỉ tạo bài khi bấm Lưu. Không đổi schema. Cần Epic 3, 4, 5. (thêm 2026-11-09, Sprint Change Proposal 2026-11-09)
**FRs covered:** FR-39, FR-40

**Phụ thuộc:** 1 → mọi epic; 4 cần 2; 5 cần 3, 4; 6 cần 2, 3; 8 cần 7 (FR-34); 10 cần 4, 5; 11 cần 3, 4, 5.

**Tách epic có chủ đích:** Epic 4 và Epic 5 cùng chạm `modules/suggestions`; giữ tách vì Epic 4 là điểm phản hồi sớm về nhà cung cấp AI và gộp lại thành ~14 story.

**Áp cho mọi story có giao diện:** trạng thái chung (UX-DR83 site, UX-DR84 CMS), thao tác được phép / bị cấm (UX-DR85, UX-DR86), focus và bàn phím (UX-DR88), ARIA và vùng live (UX-DR89), reduced motion (UX-DR91), vùng bấm 44px (UX-DR92), CMS mobile-first 360px (UX-DR94), microcopy và từ cấm (UX-DR95–UX-DR97), định dạng vi-VN (UX-DR98), không dựng phần Stitch bị loại (UX-DR99).

## Epic 1: Epic nền — site cũ chạy trên cấu trúc mới

Website và CMS vẫn chạy như hiện tại, nhưng code mới có chỗ đúng (`modules/`, `platform/`), có Vitest, ESLint chặn import sai tầng, database đã có Danh mục và Sản phẩm dùng chung. Làm đúng 4 bước AD-17 theo thứ tự; bước 3 (migration nền) đúng một story. Không story nghiệp vụ nào nằm trong hoặc trước epic này.

### Story 1.1: Kiểm chứng hành vi Next.js và khoá `/cms` đúng matcher (AD-17 bước 1)

As a Vinh (người vận hành),
I want các giả định về cache, Server Action công khai và bảo vệ CMS được kiểm trên bản build thật,
So that mọi epic sau xây trên hành vi đã xác nhận, không trên giả định.

**Acceptance Criteria:**

**Given** app chạy bằng `npm run build && npm start` trên Postgres cục bộ (cổng 54329)
**When** sửa một Bài web đã xuất bản trong CMS (action gọi `updateTag`)
**Then** `/bai-viet/[slug]` và `sitemap.xml` (đã prerender) hiện nội dung mới mà không deploy lại; kết quả ghi vào `docs/no-ky-thuat.md` mục `[NO-23]` (đạt / không đạt + cách tái hiện)

**Given** một trang `(site)` có `ensureStatic = "navigation"`
**When** trang gọi một Server Action công khai dựng tạm để thử (không đọc/ghi dữ liệu thật)
**Then** build không lỗi, trang vẫn tĩnh và action trả kết quả; ghi kết quả vào `[NO-24]`; action thử bị xoá sau khi ghi

**Given** matcher `proxy.ts` đổi thành `["/cms", "/cms/((?!upload$).*)", "/api/:path*"]` (AD-24)
**When** chạy `curl -I` không kèm header Authorization tới `/cms`, `/cms/bai-viet`, `/cms.rsc`
**Then** cả ba trả `401` kèm `WWW-Authenticate`; kèm đúng thông tin đăng nhập thì `/cms` trả `200`

**Given** bản build trên
**When** `curl -I` tới `/bai-viet/khong-ton-tai`
**Then** trả `404` (kiểm 308 cho slug cũ chuyển sang story đổi slug của Epic 3 — quyết định 2026-11-05)

**And** nếu `[NO-23]` hoặc `[NO-24]` không đạt thì dừng, báo Vinh và đề xuất cập nhật spine trước khi làm Story 1.2

### Story 1.2: Dựng `platform/` và khung test Vitest (AD-17 bước 2, phần 1)

As a người phát triển (agent build),
I want hạ tầng chung nằm ở `platform/` có unit test và các lỗi bảo mật đã biết được sửa,
So that module nghiệp vụ mới chỉ import từ `platform/`, không từ `lib/`.

**Acceptance Criteria:**

**Given** bảng `docs/cong-thuc/chuyen-code-cu.md`
**When** chuyển `lib/db.ts`, `lib/auth.ts`, `lib/require-admin.ts`, `lib/sanitize.ts`, `lib/content.ts`, `lib/slug.ts`, `lib/images.ts`, `lib/format.ts`, `lib/site.ts` và phần trường dùng chung của `lib/post-input.ts`
**Then** chúng nằm ở `platform/db`, `platform/auth/{basic-auth,require-admin,run}`, `platform/errors.ts`, `platform/validation/{fields,errors}.ts`, `platform/html/`, `platform/slug.ts`, `platform/images.ts`, `platform/format.ts`, `platform/site`; mọi import được sửa thẳng (không re-export từ chỗ cũ); file `lib/` tương ứng bị xoá
**And** `platform/db` mở đầu `import "server-only"` (AD-8); `run()` trả `Result<T>`, lỗi người dùng là `UserError` tiếng Việt, lỗi bất ngờ là "Có lỗi xảy ra, thử lại sau" (AD-13)

**Given** Vitest 5.1.0 được thêm (alias `server-only` sang file rỗng, `@/` theo `tsconfig` — AD-16) và lệnh test được ghi vào `docs/kiem-chung.md`
**When** chạy bộ test
**Then** có unit test (tên tiếng Việt, cạnh nguồn) cho `platform/html`, `platform/images`, `platform/slug`, `platform/validation/fields`, `platform/format`, và chúng chạy xanh

**Given** các lỗi `[NO-01]`..`[NO-06]`, `[NO-11]`
**When** sửa trong `platform/`
**Then** có test chứng minh: thân bài sau sanitize không còn `a`, `img` (NO-01, NO-02); `//evil.com/x.png` bị từ chối (NO-03); validate form và `remotePatterns` cùng đọc `platform/images.ts` (NO-04); `shopeeAffiliateUrl` chỉ nhận domain Shopee chính chủ (NO-05); bài nháp AI qua cùng schema (NO-06); `requireAdmin` và lỗi không tìm thấy bản ghi trả thông báo tiếng Việt (NO-11)
**And** `platform/format.ts` định dạng `vi-VN`, múi giờ `Asia/Ho_Chi_Minh` (AD-27)
**And** site và CMS hiện tại vẫn chạy như trước (đọc bài, soạn, xuất bản); `npx tsc --noEmit`, `npm run lint` sạch

### Story 1.3: Khoá ranh giới module bằng ESLint (AD-17 bước 2, phần 2)

As a người phát triển (agent build),
I want máy tự chặn import sai tầng và vòng import,
So that 11 module xây độc lập không trộn lẫn hay phụ thuộc vòng.

**Acceptance Criteria:**

**Given** `eslint.config` thêm `no-restricted-imports` cho `modules/**`, `platform/**`, `components/shared/**`, `app/**`
**When** một file thử import sai (module tầng T1 import module T2; `platform/` import `modules/`; `app/` import `service.ts` hay `platform/db`; module import `@/lib/*` hoặc `@/components/site|cms/*`)
**Then** `npm run lint` báo lỗi; import đúng tầng (T4 → T0..T3; `queries.ts`, `types.ts`, `tags.ts`, `components/` của module khác) không bị báo (AD-2)
**And** `import/no-cycle` được bật; file cũ còn ở vị trí cũ được miễn bằng danh sách `ignores` tường minh

**Given** `components.json`
**When** đổi alias `lib` → `@/components/ui/lib`, `utils` → `@/components/ui/lib/utils`, `hooks` → `@/components/ui/hooks`
**Then** `cn` nằm ở `components/ui/lib/utils.ts`, `lib/utils.ts` bị xoá, `npx shadcn add` thử một component ghi đúng chỗ (rồi gỡ)

**Given** trang `/styleguide`
**When** chuyển vào `app/cms/styleguide` (noindex, sau Basic Auth)
**Then** `/styleguide` trả 404, `/cms/styleguide` hiện đủ như trước (NFR-10)

**And** `maxDuration = 120` đặt ở `app/cms/layout.tsx` (thay 60 — AD-18)
**And** Vinh đã duyệt `[QU-26]`–`[QU-28]` trong `docs/quy-uoc-code.md` (điều kiện chặn đóng story; agent không tự duyệt)

### Story 1.4: Migration nền — Danh mục và Sản phẩm dùng chung (AD-17 bước 3)

As a Vinh (người vận hành),
I want database có Danh mục và một Sản phẩm dùng được ở nhiều Bài web, mà 10 bài mẫu không mất gì,
So that các epic Sản phẩm, Danh mục, Bài web xây trên mô hình dữ liệu đúng.

**Acceptance Criteria:**

**Given** `prisma/schema.prisma` hiện tại
**When** tách thành `prisma/schema/` (`_base.prisma` + `<module>.prisma` theo module chủ — AD-4), generator `output` = `../../generated/prisma`
**Then** `npx prisma generate` chạy, import vẫn là `@/generated/prisma/client`

**Given** một migration duy nhất `--create-only`, tên `verb_object` (AD-15), SQL được đọc trước khi áp
**When** áp migration trên Postgres cục bộ
**Then** enum `Category` đổi thành `PostType` (`MEO_VAT`, `GOM_LINK`), cột `Post.category` thành `Post.postType`; có model `Category` (chủ `categories`; `name`, `slug`, `description`, thứ tự hiển thị), `Post.categoryId` và `Product.categoryId` (nullable, `onDelete` ghi rõ); có bảng nối `PostProduct` (chủ `posts`, có thứ tự); dữ liệu `Product.postId` được chép sang `PostProduct` rồi cột `Product.postId` bị bỏ (quyết định 2026-11-05)
**And** không thêm cột ngoài danh sách trên (`hidden`, `priceText`, `searchText`, bảng lịch sử slug do story FR tương ứng thêm)

**Given** số Bài web, Sản phẩm và cặp bài–Sản phẩm đếm trước migration
**When** đếm lại sau migration
**Then** số Bài web và Sản phẩm không đổi, số dòng `PostProduct` bằng số Sản phẩm cũ; 10 bài mẫu vẫn hiện đủ Sản phẩm trên trang bài

**Given** `npm run db:seed` trên database trống
**When** seed chạy
**Then** có ít nhất một Danh mục và một Bài web đã xuất bản gắn Danh mục đó (để `generateStaticParams` không trả rỗng — AD-7); seed chạy lại không lỗi

**And** code đọc/ghi `Product.postId` và `category` được sửa theo mô hình mới; site và CMS chạy như trước; `npx tsc --noEmit`, `npm run lint` sạch

### Story 1.5: Cập nhật tài liệu và AGENTS.md theo cấu trúc mới (AD-17 bước 4)

As a người phát triển (agent build),
I want `docs/` và `AGENTS.md` mô tả đúng cấu trúc đã dựng,
So that agent sau không làm theo cấu trúc cũ.

**Acceptance Criteria:**

**Given** epic nền bước 1–3 đã xong
**When** cập nhật `docs/kien-truc-codebase.md`, `docs/quy-uoc-code.md`, `docs/nen-tang-ky-thuat/*`, `docs/cong-thuc/*`, `docs/kiem-chung.md`
**Then** mọi đường dẫn file được nhắc tới tồn tại (kiểm bằng `ls`), không còn hướng dẫn tạo file ở `lib/`, `components/site|cms/`

**Given** `docs/quy-dinh.md`
**When** sửa luật
**Then** `[QD-12]` đòi sanitize khi ghi và khi render (AD-22); `[QD-14]` trỏ `AffiliateLink`; `[QD-20]` ghi đủ ba ngoại lệ (action `engagement` kể cả đọc số tim, `posts.searchPosts`, route upload — AD-6); `[PR-15]`, `[PR-16]` theo `prisma/schema/`

**And** Supabase được ghi là giả định (Deferred) ở nơi docs nhắc tới
**And** khối `bmad:context` của `AGENTS.md` được làm mới qua `bmad-project-context` (không sửa tay — QD-03)

## Epic 2: Kho Sản phẩm và Danh mục

Vinh tạo, sửa, ẩn Sản phẩm dùng chung với Link affiliate Shopee hợp lệ, quản lý Danh mục; người đọc duyệt site theo Danh mục và Loại bài có phân trang; mọi link Shopee qua `AffiliateLink` kèm nhãn công khai. Story upload để cuối, chặn bởi Deferred "backend lưu file".

### Story 2.1: Bộ token thiết kế và khung CMS

As a Vinh (người vận hành),
I want site dùng bộ màu, chữ, khoảng cách mới (sáng/tối theo hệ thống) và CMS có menu điều hướng trên điện thoại,
So that mọi màn sau dựng trên cùng một hệ thiết kế và tôi đi lại trong CMS bằng một tay.

**Acceptance Criteria:**

**Given** token trong frontmatter `DESIGN.md`
**When** khai báo vào theme Tailwind 4 / biến shadcn
**Then** màu, typography (Be Vietnam Pro), rounded, spacing, elevation, token component, icon Lucide có đúng một nguồn (UX-DR1, UX-DR3, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10); CMS áp phần khác biệt chung trên shadcn base-nova (UX-DR37); dark mode áp theo `prefers-color-scheme`, không có nút đổi tay (UX-DR2, NFR-11)
**And** các cặp chữ/nền đạt tương phản WCAG AA theo bảng vai trò màu (UX-DR4); `/cms/styleguide` hiện mọi token và component đã có ở cả hai chế độ (UX-DR82)

**Given** mọi màn CMS
**When** mở trên màn 360px
**Then** (UX-DR94) CmsShell có thanh trên dính (tên mục hiện tại + nút menu) mở `Sheet` trái liệt kê mục danh sách theo thứ tự IA; ≥ 1024px là sidebar cố định; nút "Xem site" mở `/` tab mới (UX-DR38)
**And** mục chưa có màn (vd Cảm hứng, Banner) không hiện trong menu cho tới khi story của nó làm xong
**And** lỗi `UserError` từ server hiện bằng Toast (Sonner) (AD-13, AD-14)

### Story 2.2: Quản lý Danh mục trong CMS

As a Vinh,
I want tạo, sửa, sắp thứ tự và xoá Danh mục dùng chung cho Bài web và Sản phẩm,
So that site được tổ chức theo chủ đề thay cho hai mục cố định.

**Acceptance Criteria:**

**Given** màn `/cms/danh-muc` (module `categories`)
**When** tạo/sửa Danh mục (tên, đường dẫn, mô tả, thứ tự)
**Then** lưu qua `run()` → `categoryInputSchema` → `categories/service.ts` → `updateTag(CATEGORIES_TAG)` (AD-6); lỗi validate hiện tại trường phía client cùng schema (AD-14); dựng chung CmsForm, ConfirmDialog, UnsavedChangesGuard ở `components/shared/` để các form sau dùng lại (UX-DR78, UX-DR58, UX-DR59, UX-DR60)
**And** đường dẫn trùng `RESERVED_ROOT_SLUGS` (`cms`, `api`, `bai-viet`, `bio`, `tim-kiem`, `meo-vat`, `gom-link`, `trang`, thư mục gốc `app/(site)`) bị từ chối "Đường dẫn này đã dành cho hệ thống"; có test so danh sách với thư mục `app/(site)` (AD-20)

**Given** Danh mục còn Bài web hoặc Sản phẩm
**When** Vinh xoá
**Then** bị chặn, Toast nêu số Bài web và Sản phẩm còn lại, gợi ý chuyển Danh mục trước; Danh mục trống xoá được qua ConfirmDialog (FR-28)

**Given** nút lên/xuống
**When** đổi thứ tự
**Then** thứ tự mới lưu ngay và dùng cho menu site

**Given** seed
**When** chạy `npm run db:seed`
**Then** có 8 Danh mục khởi tạo đề xuất: Nhà bếp, Nhà cửa & Decor, Giặt giũ & Tủ đồ, Làm đẹp, Thời trang, Cây cảnh, Học tập & Làm việc, Du lịch (PRD Câu hỏi mở 5 — Vinh xác nhận danh sách trước khi đóng story)

**And** đổi đường dẫn và chuyển hướng 308 cho Danh mục làm ở Story 2.7 (cần trang public)

### Story 2.3: Kho Sản phẩm — danh sách, tạo và sửa

As a Vinh,
I want tạo và sửa Sản phẩm với tên, Link affiliate, giá tham khảo, ảnh (dán URL), Danh mục và Dữ liệu thô,
So that một Sản phẩm nhập một lần dùng được ở nhiều bài.

**Acceptance Criteria:**

**Given** `/cms/san-pham` (module `products`)
**When** mở danh sách
**Then** thấy DataList (UX-DR39) Sản phẩm, tìm theo tên, StatusBadge, nút "Tạo Sản phẩm" → `/cms/san-pham/moi`; danh sách rỗng hiện "Chưa có Sản phẩm nào. Tạo Sản phẩm đầu tiên." (UX-DR73, State Patterns)

**Given** form Sản phẩm ở `/cms/san-pham/moi` và `/cms/san-pham/[id]` (UX-DR74)
**When** lưu
**Then** Link affiliate bắt buộc và chỉ nhận domain Shopee chính chủ (`shopee.vn`, `s.shopee.vn`, `shope.ee`), sai thì lỗi tại trường "Link phải thuộc Shopee (shopee.vn, s.shopee.vn, shope.ee)" (FR-3, AD-14); URL ảnh chỉ nhận host trong `platform/images.ts`; Danh mục chọn tay từ danh sách có sẵn
**And** giá lưu thành `priceText` + `priceUpdatedAt` (đổi giá thì cập nhật ngày); cột Dữ liệu thô (chữ, đánh giá, URL ảnh) thuộc `products`, ghi rõ trong story theo AD-15
**And** đây là story có migration (thêm `priceText`, `priceUpdatedAt`, Dữ liệu thô; chuyển dữ liệu `Product.price` cũ sang `priceText`); `--create-only`, đọc SQL trước khi áp
**And** lưu xong ở lại `/cms/san-pham/[id]`; `updateTag` tag `products` (và `posts` vì trang bài hiện Sản phẩm — AD-7)

**Given** Sản phẩm mẫu có link `shopee.vn/search?keyword=…`
**When** Vinh sửa Sản phẩm đó
**Then** hành vi theo quy tắc domain ở trên; nếu link tìm kiếm vẫn qua được domain check thì ghi câu hỏi mở cho PRD (addendum A4), không tự thêm quy tắc đường dẫn

**And** màn chi tiết hiện "nơi đang dùng": các Bài web gắn Sản phẩm này (query đặt ở `posts` — AD-2)
**And** có unit test cho `productInputSchema`

### Story 2.4: AffiliateLink, nhãn công khai và ProductCard

As a người đọc,
I want thấy Sản phẩm với giá tham khảo có ngày cập nhật, nút Shopee mở thẳng link chính chủ và nhãn công khai rõ ràng,
So that tôi mua tin cậy, biết trang có hoa hồng.

**Acceptance Criteria:**

**Given** `modules/products/components/`
**When** dựng `AffiliateLink`, `AffiliateDisclosure`, `ProductCard` (*row*, *tile*) và chuyển `components/site/product-card.tsx`, `affiliate-disclosure.tsx` về đây
**Then** mọi link Shopee trên site đi qua `AffiliateLink`: nguyên link, `target="_blank"`, `rel="sponsored nofollow noopener"`, không qua `/go/...` (FR-25, UX-DR21)
**And** ProductCard là một `<a>` duy nhất, tên truy cập "tên → giá → Xem trên Shopee, mở Shopee trong tab mới", ảnh lỗi tải dùng ImageFallback (UX-DR20, UX-DR35, UX-DR90)
**And** giá hiện "Giá tham khảo ~89.000đ · cập nhật dd/mm/yyyy" qua `platform/format` (UX-DR95, UX-DR98)

**Given** trang Bài web có ≥ 1 Sản phẩm
**When** render
**Then** AffiliateDisclosure hiện ngay dưới dòng meta, trước ảnh đầu bài, không thu nhỏ hay ẩn; bài không có Sản phẩm thì không render (FR-24, UX-DR22)
**And** khối Sản phẩm trong bài là danh sách ProductCard *row*, đọc qua `publicProductSelect` của `products`

### Story 2.5: Ẩn Sản phẩm

As a Vinh,
I want ẩn hoặc hiện lại một Sản phẩm bằng một chạm,
So that hàng vi phạm hoặc ngừng bán biến mất khỏi website trong khoảng 1 phút.

**Acceptance Criteria:**

**Given** Sản phẩm đang hiện
**When** Vinh chạm "Ẩn" ở chi tiết hoặc danh sách
**Then** StatusBadge "Ẩn" + Toast "Hoàn tác"; CMS liệt kê các Bài web (và Bộ nội dung khi có) đang dùng Sản phẩm, mỗi mục là link (FR-5)
**And** story có migration thêm `Product.hidden`; Sản phẩm đang dùng chỉ ẩn, không xoá cứng (AD-15)

**Given** `visibleProductWhere` + `publicProductSelect` trong `products/queries.ts`
**When** mọi query public trả Sản phẩm (kể cả ảnh đại diện fallback của bài)
**Then** dùng hai hằng này; Sản phẩm ẩn và Link affiliate của nó không còn trên website sau ≤ 1 phút, không deploy lại (FR-5, NFR-5, QD-16, AD-7)
**And** có test tích hợp "ẩn Sản phẩm biến mất khỏi mọi query public" trên Postgres test (AD-16)

### Story 2.6: Điều hướng site theo Danh mục

As a người đọc,
I want menu site có Mẹo vặt, Gom link và các Danh mục,
So that tôi tìm bài theo chủ đề trên điện thoại và máy tính.

**Acceptance Criteria:**

**Given** layout `(site)`
**When** mở trên < 1024px
**Then** có SiteHeader (logo chữ + dòng phụ + nút tìm), BottomTabBar 5 tab (Tạp chí, Mẹo vặt, Gom link, Danh mục, Đồ hay) với tab khớp route kể cả `/trang/n`, trừ trang bài (UX-DR11, UX-DR12)
**And** tab "Danh mục" mở CategorySheet liệt kê Danh mục có ≥ 1 Bài web đã xuất bản theo thứ tự hiển thị; đóng bằng vuốt/Esc/chạm nền, bẫy focus và trả focus (UX-DR13); query đặt ở `posts` (tầng cao nhất chạm bảng — AD-2), gắn tag `posts` + `categories` (AD-7)

**Given** ≥ 1024px
**When** mở site
**Then** SiteHeader có nav ngang (Mẹo vặt, Gom link, Danh mục theo thứ tự, phần không vừa gom vào "Thêm"), nút tìm, nút "Đồ hay"; không BottomTabBar (UX-DR11, UX-DR93)

**And** SiteFooter có tên + giới thiệu, link Danh mục, link `/bio`, AffiliateDisclosure dạng chữ, © (UX-DR14); vùng bấm ≥ 44px; component chuyển từ `components/site/` về `app/(site)/_components/`
**And** link `/bio`, `/tim-kiem` trỏ tới trang chưa có thì giữ chỗ theo hành vi hiện tại (404) cho tới epic tương ứng

### Story 2.7: Trang Danh mục và trang Loại bài có phân trang

As a người đọc,
I want trang liệt kê bài theo Danh mục và theo Loại bài, có phân trang,
So that tôi đọc hết bài của một chủ đề.

**Acceptance Criteria:**

**Given** route `/[danh-muc]`, `/[danh-muc]/trang/[n]` (đổi tên thư mục `[category]`) và thư mục tĩnh `/meo-vat`, `/meo-vat/trang/[n]`, `/gom-link`, `/gom-link/trang/[n]`
**When** mở trang
**Then** có Breadcrumb, mô tả (Danh mục) hoặc nhãn Loại bài, lưới PostCard, Pagination (UX-DR28, UX-DR29, UX-DR64, UX-DR65); `PAGE_SIZE` ở `posts/constants.ts`
**And** trang tĩnh: không đọc `searchParams`; `generateStaticParams` không trả rỗng (giữ chỗ `n = "2"` → `notFound()`); `/…/trang/1` → `permanentRedirect` về trang gốc; `n` vượt quá → 404 (AD-7)
**And** Danh mục rỗng → EmptyState "Danh mục này chưa có bài nào" + link Trang chủ

**Given** Danh mục đã công khai
**When** Vinh đổi đường dẫn trong CMS
**Then** ghi `CategorySlugRedirect` (story có migration thêm bảng này); đường dẫn cũ trả 308 sang mới, tra ở `page.tsx` qua query cache trước `<Suspense>` (FR-28, AD-20, AD-12)

**And** meta description = mô tả Danh mục; sitemap có trang Danh mục và Loại bài, trang `/trang/n` không vào sitemap, canonical chính nó + `BreadcrumbList` (FR-29, AD-26, NFR-8)
**And** query gắn tag `posts` + `categories` (AD-7); sửa/xoá Danh mục thấy trên site ≤ 1 phút

### Story 2.8: Tải ảnh Sản phẩm từ điện thoại

As a Vinh,
I want chụp hoặc chọn ảnh từ điện thoại để gắn vào Sản phẩm,
So that không phải tìm URL ảnh khi đang làm trên điện thoại (UJ-1 bước 1).

**Nơi lưu (chốt 2026-11-05):** đĩa cục bộ của máy chủ, thư mục cấu hình bằng biến môi trường, ngoài `public/`. Story này chốt cách phục vụ file (route handler hay reverse proxy; đọc `node_modules/next/dist/docs/` về `public/` trước) và cách backup; host/đường dẫn ảnh thêm vào `platform/images.ts`.

**Acceptance Criteria:**

**Given** `app/cms/upload/route.ts` (ngoài matcher proxy — AD-24)
**When** gửi file
**Then** route gọi `requireAdmin()` trước khi đọc body; thiếu quyền trả 401 kèm `WWW-Authenticate` cùng realm `proxy.ts`; kiểm loại và dung lượng (ảnh; video ≤ 100 MB); gọi `platform/storage.put(file) → { url }`; module chỉ lưu `url`
**And** `[QD-20]` đã ghi route upload là ngoại lệ (Story 1.5)

**Given** UploadField trong `components/shared/` (UX-DR54)
**When** Vinh chọn file hoặc dán URL ảnh
**Then** có thanh tiến trình, huỷ được, xem trước đúng tỉ lệ; sai loại / quá cỡ / host không cho phép → lỗi tại trường, các trường khác giữ nguyên

**And** kiểm tay: file > 10 MB nhận nguyên vẹn; Basic Auth được gửi khi upload trên Chrome và Safari iOS (AD-24); kết quả ghi vào `docs/kiem-chung.md`
**And** biến môi trường mới của nơi lưu thêm vào `.env.example` (QD-06)

## Epic 3: Bài web hoàn chỉnh — đọc và quản lý

Vinh soạn bài, gắn nhiều Sản phẩm, xem trước, xuất bản, đổi slug (link cũ chuyển hướng 308). Người đọc có Trang chủ, trang bài (mục lục, bài liên quan, breadcrumb), 404 và trang lỗi, SEO đầy đủ. Like/Share, Xem nhiều, Banner, Gom link đồ xinh, tìm kiếm thêm vào ở epic của chúng.

### Story 3.1: Danh sách và trạng thái Bài web trong CMS

As a Vinh,
I want danh sách Bài web lọc theo trạng thái, xuất bản / chuyển về nháp / xoá bài có xác nhận,
So that tôi quản lý mọi bài từ điện thoại.

**Acceptance Criteria:**

**Given** route CMS cũ (`/cms`, `/cms/new`, `/cms/posts/[id]`)
**When** chuyển theo `docs/cong-thuc/chuyen-code-cu.md`
**Then** danh sách ở `/cms/bai-viet`, soạn ở `/cms/bai-viet/moi`, `/cms/bai-viet/[id]`; `/cms` chuyển thẳng tới `/cms/bai-viet` (UX-DR70); route cũ trả 404

**Given** `/cms/bai-viet`
**When** lọc Nháp / Đã xuất bản
**Then** tham số nằm trên URL, Server Component đọc `searchParams` và gọi `posts/cms-queries.ts`, không có action đọc (AD-12); StatusBadge Nháp / Đã xuất bản (UX-DR40, UX-DR71); rỗng / lọc không ra theo DataList (UX-DR39)

**Given** một Bài web
**When** Vinh xuất bản, chuyển về nháp, hoặc xoá (qua ConfirmDialog)
**Then** action ở `modules/posts/actions.ts` qua `run()` → `posts/service.ts` → `updateTag` tag `posts` (AD-6); `setPostStatus`, `deletePost` chuyển khỏi `app/cms/actions.ts` (AD-17); xoá bài không xoá Sản phẩm (FR-4)
**And** trang public cập nhật trong ≤ 1 phút (NFR-5)

### Story 3.2: Soạn Bài web và gắn nhiều Sản phẩm

As a Vinh,
I want soạn bài với trình soạn đơn giản, chọn Danh mục và Loại bài, gắn và sắp thứ tự nhiều Sản phẩm có sẵn,
So that một Sản phẩm dùng lại được ở nhiều bài.

**Acceptance Criteria:**

**Given** `/cms/bai-viet/moi` và `/cms/bai-viet/[id]`
**When** soạn
**Then** PostEditor có thanh công cụ dính: H2, H3, đoạn, danh sách, trích dẫn (Callout), đậm, nghiêng — không link, ảnh, bảng (UX-DR50); HTML qua `platform/html.sanitizePostHtml` khi ghi (AD-22, QD-12); `savePost` chuyển về `modules/posts/actions.ts`
**And** form có tiêu đề, tóm tắt, slug, thẻ, SEO title/description/keywords, Danh mục, Loại bài, ảnh đại diện (dán URL; tải lên khi Story 2.8 xong) theo `postInputSchema`; giới hạn ở `posts/constants.ts` (AD-25); CmsForm + UnsavedChangesGuard (UX-DR59, UX-DR60)

**Given** ProductPicker (UX-DR48)
**When** Vinh tìm theo tên và gắn Sản phẩm
**Then** chỉ Sản phẩm đang hiện được chọn; mỗi dòng có ảnh 40px, tên, nút lên/xuống/gỡ (vùng bấm 44px); thứ tự lưu vào `PostProduct`; gỡ không xoá Sản phẩm (FR-4)
**And** Sản phẩm hiện trên trang bài đúng thứ tự đã đặt; chi tiết Sản phẩm (Story 2.3) liệt kê bài này ở "nơi đang dùng"

**And** chấm SEO bằng AI giữ nguyên chỗ cũ cho tới khi `platform/ai` có (Epic 4); không sửa phần AI trong story này

### Story 3.3: Xem trước bài trước khi xuất bản

As a Vinh,
I want xem bài đúng như người đọc sẽ thấy trước khi xuất bản,
So that tôi bắt lỗi hiển thị trên điện thoại.

**Acceptance Criteria:**

**Given** form soạn bài (kể cả thay đổi chưa lưu)
**When** chạm "Xem trước"
**Then** PreviewSheet toàn màn render đúng component trang bài public, nhãn "Bản xem trước" dính đỉnh nền `inverse-surface` (UX-DR53, AD-11)
**And** thân bài trong bản xem trước cũng qua `sanitizePostHtml` (AD-22)

### Story 3.4: Đổi slug giữ link cũ

As a Vinh,
I want đổi đường dẫn bài đã xuất bản mà link đã chia sẻ không chết,
So that sửa slug không mất người đọc từ Threads/Facebook/Google.

**Acceptance Criteria:**

**Given** bài đã xuất bản
**When** Vinh đổi slug
**Then** `posts/service.ts` ghi `PostSlugRedirect` (story có migration thêm bảng này); slug mới không trùng slug bài khác
**And** `/bai-viet/<slug-cũ>` trả 308 sang slug mới: `page.tsx` tra lịch sử qua `posts/queries.ts` có cache rồi `permanentRedirect()` trước `<Suspense>`; không dùng `next.config` redirects hay `proxy.ts` (FR-27, AD-20, AD-12)
**And** kiểm `curl -I` trên `npm run build && npm start`: slug cũ trả 308, slug không tồn tại trả 404 (phần dời từ AD-17 bước 1 — quyết định 2026-11-05); đổi slug nhiều lần thì mọi slug cũ đều tới slug cuối

### Story 3.5: Trang bài viết hoàn chỉnh

As a người đọc,
I want trang bài có mục lục, thời gian đọc, breadcrumb, Sản phẩm, thẻ và bài liên quan,
So that tôi đọc dễ trên điện thoại và đi tiếp sang bài cùng chủ đề.

**Acceptance Criteria:**

**Given** `/bai-viet/[slug]`
**When** mở bài
**Then** các khu theo thứ tự: Breadcrumb "Trang chủ › {Danh mục}" → PostTypeBadge + H1 + ngày · phút đọc → AffiliateDisclosure (nếu có Sản phẩm) → ảnh đầu bài 16:9 → TableOfContents → ArticleBody → khối Sản phẩm → PostTags → RelatedPosts (FR-26, UX-DR63, UX-DR18, UX-DR19, UX-DR24, UX-DR28)
**And** TOC sinh từ h2 sau sanitize, < 2 h2 thì ẩn; mobile mặc định mở, desktop dính cột phải (UX-DR23); phút đọc tính sau sanitize (AD-22); thân bài sanitize cả khi render
**And** RelatedPosts tối đa 3 bài cùng Danh mục, mới nhất trước; < 3 hiện số có, 0 thì ẩn khu (UX-DR17)
**And** mobile: ArticleActionBar thay BottomTabBar, có nút "Sản phẩm" cuộn tới khối Sản phẩm (ẩn khi bài không có Sản phẩm) — LikeButton, ShareButtons thêm ở Epic 8 (UX-DR27); desktop: thân 8 cột + cột phải dính (UX-DR93)

**Given** SEO trang bài
**When** render metadata
**Then** canonical chính nó, JSON-LD `Article` + `BreadcrumbList` theo Danh mục, OpenGraph lấy ảnh đại diện (fallback ảnh Sản phẩm đầu tiên qua `publicProductSelect`, không có thì ảnh mặc định `platform/site`) (NFR-8, AD-26, AD-7)
**And** query gắn tag `posts` + `products` + `categories`; trang tĩnh, không đọc `searchParams`/`headers()` (AD-7); đạt CWV "Tốt" trên di động khi đo bằng Lighthouse mobile (NFR-5)

### Story 3.6: Trang chủ theo bố cục mới

As a người đọc,
I want Trang chủ có bài nổi bật, bài mới cập nhật và lối vào Mẹo vặt / Gom link,
So that tôi thấy ngay nội dung mới nhất.

**Acceptance Criteria:**

**Given** `/`
**When** mở trên mobile
**Then** có Bài nổi bật (Bài web xuất bản mới nhất, PostCard *featured*), Mới cập nhật (bỏ bài nổi bật để không trùng, cuối khu link "Mẹo vặt" → `/meo-vat`, "Gom link" → `/gom-link`) và các khu còn lại theo thứ tự UX-DR62; PostCard đủ biến thể *featured*, *grid*, *row* (UX-DR16)
**And** khu Banner (Epic 9), Gom link đồ xinh (Epic 6), Xem nhiều (Epic 8) chưa render và không chừa chỗ trống
**And** desktop theo bố cục desktop của UX-DR62; Trang chủ có trong sitemap, không JSON-LD (AD-26)
**And** đang tải là Skeleton cùng bố cục (UX-DR34); ảnh lỗi dùng ImageFallback

### Story 3.7: Trang 404, trang lỗi và nền SEO toàn site

As a người đọc,
I want khi vào link hỏng hay trang lỗi vẫn thấy lối quay lại,
So that tôi không rời site.

**Acceptance Criteria:**

**Given** ba file `app/(site)/not-found.tsx`, `app/cms/not-found.tsx`, `app/not-found.tsx` (AD-12)
**When** vào đường dẫn không có
**Then** site hiện EmptyState "Trang này không còn ở đây" + link Trang chủ qua `NotFoundScreen` dùng chung cho hai file site (UX-DR68, UX-DR33); SearchBox và 3 bài Xem nhiều thêm ở Epic 8; CMS hiện "Không tìm thấy. Có thể đã bị xoá." + link về danh sách (UX-DR84)

**Given** `error.tsx` ở `(site)`, `cms` và `global-error.tsx`
**When** có lỗi bất ngờ
**Then** hiện "Trang đang trục trặc một chút" + "Thử lại" + link Trang chủ, không lộ chi tiết nội bộ (UX-DR69, AD-13)

**Given** nền SEO
**When** kiểm `sitemap.xml`, `robots.txt`, metadata
**Then** sitemap gồm Trang chủ, Bài web, Danh mục, Loại bài (không `/trang/n`); robots chặn `/cms`; title template, `lang="vi"`, canonical, OpenGraph mặc định (NFR-8, AD-26)
**And** mỗi trang một `h1`, có link "Bỏ qua tới nội dung", không chặn zoom (UX-DR87); focus thấy rõ, đi được bằng bàn phím (UX-DR88); vùng `aria-live` cho Toast và kết quả (UX-DR89); hiệu ứng tắt khi reduced-motion (UX-DR91); trạng thái chung site theo UX-DR83; vùng bấm ≥ 44px (UX-DR92); microcopy theo UX-DR95, UX-DR97

## Epic 4: Nghiên cứu Sản phẩm bằng AI

Vinh bấm "Nghiên cứu": AI tìm web, đọc ảnh, tóm tắt đánh giá, gợi ý Người đọc mục tiêu, Góc viết, Danh mục; Vinh Duyệt, Từ chối hoặc Tạo lại; chạy nền, rời màn quay lại vẫn thấy. Epic này dựng lõi gợi ý AI (`platform/ai`, `Suggestion`, SuggestionCard, poller, Duyệt/Tạo lại) mà Epic 5 mở rộng.

**Nhà cung cấp AI (chốt tạm 2026-11-05):** Claude Code CLI chạy không giao diện (`claude -p`) trên máy chủ, theo gói thuê bao Vinh đang trả; story 4.1 kiểm hạn 90 giây và hạn mức với `claude -p`, chọn nhà dự phòng (xem `_bmad-output/planning-artifacts/research/recon-ai-storage-2026-11-05.md`), trong giới hạn NFR-9 và QD-09.

### Story 4.1: Lớp AI chung và chấm SEO trên nhà cung cấp mới

As a Vinh,
I want mọi tính năng AI đi qua một lớp chung, tự chuyển nhà khi một nhà lỗi, và nút "Chấm SEO" chạy trên nhà cung cấp mới,
So that đổi nhà cung cấp không phải sửa từng tính năng và không tốn tiền.

**Acceptance Criteria:**

**Given** `platform/ai` (mở đầu `import "server-only"`)
**When** một module gọi `ask({ prompt, input, images?, videoUrl?, webSearch? })`
**Then** nhận `{ data, sources?, skipped }`; `data` đã parse theo `PromptDef.output` (Zod); parse lỗi thì thử lại đúng một lần kèm lỗi Zod, vẫn lỗi → `UserError` tiếng Việt (AD-10)
**And** năng lực nhà cung cấp không có (ảnh, tìm web, video) ghi vào `skipped`, không ném lỗi
**And** mỗi lần gọi có hạn 90 giây cài trong `platform/ai`; nhà lỗi / hết hạn mức / quá hạn thì chuyển nhà khác nếu có; tất cả lỗi → thông báo tiếng Việt, dữ liệu đã nhập không mất (NFR-2, NFR-3)
**And** quy tắc chung (cấm bịa số liệu, giá, công dụng y khoa tuyệt đối; tiếng Việt có dấu chuẩn) ở `platform/ai/rules.ts` (QD-11); log chỉ trong `platform/ai`, không log secrets (QD-05)
**And** có chế độ giả lập cho test, không test nào gọi AI thật (AD-16); biến môi trường mới vào `.env.example` kèm giới hạn free tier (QD-06, QD-10)

**Given** nút "Chấm SEO" ở Soạn Bài web
**When** Vinh chạm
**Then** gọi `posts.checkPostSeo` (qua `run()`, prompt `modules/posts/prompts/seo-review.prompt.ts`), trả SeoCheckPanel chỉ đọc: điểm + gợi ý, không lưu, không qua Duyệt (FR-13, AD-9, UX-DR52); `runSeoCheck` chuyển khỏi `app/cms/actions.ts`

**And** tính năng AI cũ còn lại (`createPost` có AI, `runThreads`) giữ nguyên tới khi Epic 5 thay; gỡ gói `openai` ở story thay thế cuối cùng của Epic 5 — ghi điều này vào `docs/no-ky-thuat.md`

### Story 4.2: Bấm "Nghiên cứu" và theo dõi tiến trình

As a Vinh,
I want bấm "Nghiên cứu" trên một Sản phẩm, khoá máy, mở lại vẫn thấy AI đang chạy hoặc đã xong,
So that tôi không phải ngồi chờ trên màn hình.

**Acceptance Criteria:**

**Given** Chi tiết Sản phẩm chưa có hồ sơ
**When** chạm "Nghiên cứu"
**Then** action trong `modules/suggestions/actions.ts` (qua `run()`) ghi `Suggestion` kind `RESEARCH` ở `GENERATING` gắn `productId`, trả ngay, gọi AI trong `after()` với prompt `modules/research/prompts/` (AD-9, AD-18)
**And** story có migration tạo `Suggestion` (chủ `suggestions`): `kind`, `status`, `payload` (Json, Zod theo kind), `riskWarnings`, `promptId`, `promptVersion`, `editedBeforeApproval`, `parentSuggestionId`, `sources?`, `skipped?`, `firstCopiedAt?`, CHECK đúng một trong `productId`/`contentSetId`/`inspirationId`, partial unique index một `GENERATING`/`PENDING` mỗi khoá đích (viết tay, có comment — AD-15)

**Given** AI chạy xong
**When** `after()` hoàn tất
**Then** `Suggestion` thành `PENDING` với payload gồm tóm tắt Khen / Chê / Phù hợp chỉ dựa trên đánh giá đã dán (bỏ khi không có đánh giá — FR-8), 1–3 Người đọc mục tiêu kèm lý do (FR-9), ≥ 3 Góc viết kèm câu mở đầu (FR-10), mỗi lựa chọn có `id` ổn định (AD-19)
**And** lỗi thì `FAILED` kèm thông báo tiếng Việt + nút "Tạo lại" (UX-DR96)

**Given** thẻ đang `GENERATING`
**When** Vinh ở màn hoặc rời rồi quay lại
**Then** GeneratingIndicator "Đang nghiên cứu…" + thanh tiến trình + thời gian đã chạy; đúng một `generating-poller.client.tsx` mỗi màn gọi `router.refresh()` mỗi 3 giây, dừng sau 120 giây; `GENERATING` quá 120 giây hiện là Lỗi (NFR-3, UX-DR42, AD-18)
**And** StatusBadge Gợi ý AI: Đang tạo / Chờ duyệt / Đã duyệt / Đã từ chối / Lỗi (UX-DR40); SuggestionCard dựng ở `modules/suggestions/components/` theo anatomy UX-DR41 (ResearchProfileCard — UX-DR45)

### Story 4.3: Duyệt, Từ chối và Tạo lại hồ sơ nghiên cứu

As a Vinh,
I want sửa rồi Duyệt hồ sơ, hoặc Từ chối / Tạo lại kèm chỉ dẫn ngắn,
So that chỉ hồ sơ tôi đã kiểm mới được dùng để viết nội dung.

**Acceptance Criteria:**

**Given** hồ sơ *Chờ duyệt*
**When** Vinh sửa nội dung rồi chạm "Duyệt"
**Then** trong một transaction `suggestions` upsert `ResearchProfile` (chủ `research`, khoá `productId`) qua `research/service.ts`, ghi `editedBeforeApproval` nếu có sửa, rồi `updateTag` (AD-9, AD-19); story có migration tạo `ResearchProfile`
**And** sau Duyệt `payload` bất biến; thẻ hiện và sửa `ResearchProfile` bằng form của `research`; sửa không đổi trạng thái (FR-22, AD-19)

**Given** hồ sơ *Chờ duyệt* hoặc *Lỗi*
**When** chạm "Tạo lại", nhập chỉ dẫn tuỳ chọn hoặc chạm chip mẫu "ngắn hơn", "vui hơn", "bỏ phần giá"
**Then** gợi ý cũ thành `SUPERSEDED` (không hiện), gợi ý mới mang `parentSuggestionId`, thẻ chuyển Đang tạo (FR-21, UX-DR57); quá 120 giây thì bản cũ được đánh dấu `FAILED` trong cùng transaction trước khi chèn bản mới (AD-18)

**Given** hồ sơ *Chờ duyệt*
**When** chạm "Từ chối"
**Then** thẻ thu còn đầu thẻ + "Tạo lại" (UX-DR41)

**And** có unit test cho Zod payload `RESEARCH` và test tích hợp: Duyệt hai lần không tạo hai `ResearchProfile`; không thể có hai gợi ý đang chờ cho cùng Sản phẩm

### Story 4.4: AI tìm thông tin trên web và đọc ảnh Sản phẩm

As a Vinh,
I want hồ sơ có thông tin công khai kèm link nguồn và mô tả ảnh sản phẩm,
So that tôi kiểm được từng ý và bài viết đúng với món hàng.

**Acceptance Criteria:**

**Given** Sản phẩm có tên, Link affiliate và ảnh trong Dữ liệu thô
**When** nghiên cứu (lần đầu hoặc Tạo lại)
**Then** khu "Thông tin" có công dụng, cách dùng, nhận xét chung, mỗi ý kèm link nguồn (`Suggestion.sources`); không tìm được thì báo rõ, không bịa (FR-6)
**And** khu "Mô tả ảnh" tả hình dáng, màu, chất liệu, chữ trên bao bì; ảnh có chữ rõ thì trích tên sản phẩm hoặc dòng chữ chính (FR-7)

**Given** nhà cung cấp không đọc được ảnh hoặc không tìm được web
**When** hồ sơ về *Chờ duyệt*
**Then** dải thông báo đầu thân thẻ "AI chưa đọc được ảnh — hồ sơ chỉ dựa trên dữ liệu chữ" / "AI không tìm thêm được nguồn trên web"; vẫn Duyệt được (UX-DR45, UJ-1 lỗi a)

### Story 4.5: Danh mục gợi ý cho Sản phẩm

As a Vinh,
I want AI gợi ý Danh mục cho Sản phẩm trong cùng lần nghiên cứu,
So that tôi không phải tự xếp từng món.

**Acceptance Criteria:**

**Given** lần nghiên cứu Sản phẩm (một lần gọi AI)
**When** AI trả kết quả
**Then** ghi hai `Suggestion`: `RESEARCH` và `PRODUCT_CATEGORY` (chỉ chọn trong Danh mục có sẵn — FR-11); thẻ "Danh mục gợi ý" nằm ngay dưới ResearchProfileCard, Duyệt riêng → ghi `Product.categoryId` qua `products/service.ts` (AD-19)
**And** thẻ Danh mục gợi ý không có nút Tạo lại; Tạo lại hồ sơ chạy lại lần gọi chung và thay cả hai gợi ý đang chờ (AD-19, UX-DR45, UX-DR57)
**And** Vinh vẫn chọn tay Danh mục trên form Sản phẩm; chọn tay không cần Duyệt (FR-22)

## Epic 5: Xưởng Bộ nội dung

Từ hồ sơ đã Duyệt, Vinh tạo một lần Bài web, Bài Threads, Bài Facebook và Bình luận kèm link; xem Cảnh báo rủi ro, Duyệt từng phần, copy một chạm, đánh dấu đã đăng; chuyển Bài web có sẵn thành bài mạng xã hội; sửa Hồ sơ phong cách. Cao trào UJ-1; mọi màn làm được trên điện thoại 360px (NFR-4). Cần Epic 3, Epic 4.

### Story 5.1: Hồ sơ phong cách cho từng nền tảng

As a Vinh,
I want xem và sửa giọng văn, độ dài, emoji, điều cấm, nội quy và câu công khai cho Website, Threads, Facebook,
So that AI viết đúng giọng thương hiệu cho từng nơi.

**Acceptance Criteria:**

**Given** `/cms/phong-cach` (module `style-profiles`)
**When** mở lần đầu
**Then** ba hồ sơ có giá trị khởi tạo từ `style-profiles/constants.ts`: giọng thương hiệu (gần gũi, dí dỏm vừa phải kiểu Gen-Z, rõ ràng, hữu ích, không sến, không phóng đại, không giật tít, tiếng Việt có dấu chuẩn) và mặc định FR-13/14/15 (Website 600–900 từ, 3–5 h2…; Threads 4–7 bài, mỗi bài ≤ 250 ký tự, bài đầu là hook; Facebook ~80–250 từ); quy chuẩn trong prompt cũ `lib/ai.ts` chuyển thành giá trị khởi tạo (FR-18, AD-25)
**And** story có migration tạo `StyleProfile` và enum `Platform` (`WEBSITE`, `THREADS`, `FACEBOOK`) khai báo một lần ở `content-sets.prisma` (AD-25)

**Given** Vinh sửa một hồ sơ
**When** giá trị vượt giới hạn cứng (vd Threads > 500 ký tự/bài)
**Then** lỗi tại trường nêu giới hạn (kiểm ở `style-profiles/schema.ts`); lưu được thì Toast "Đã lưu — áp dụng cho nội dung tạo từ giờ"; nội dung đã tạo không đổi (UX-DR81)
**And** hồ sơ Threads và Facebook có ô "câu công khai" tuỳ chọn, mặc định trống

### Story 5.2: Tạo Bộ nội dung và Bài web từ hồ sơ đã Duyệt

As a Vinh,
I want chọn Người đọc và Góc viết rồi bấm "Tạo bộ nội dung" để AI viết Bài web,
So that tôi có bài web nháp trong vài phút.

**Acceptance Criteria:**

**Given** Chi tiết Sản phẩm có hồ sơ *Chờ duyệt* hoặc *Đã duyệt*
**When** chọn trong AudiencePicker (mặc định nhóm đầu) và AnglePicker (không chọn sẵn), có ô "Sửa lại (tuỳ chọn)"
**Then** chọn theo `id` ổn định; bản sửa chỉ vào Bộ nội dung sắp tạo, không sửa hồ sơ (UX-DR46, FR-9, FR-10)
**And** CreateContentSetPanel có PlatformToggle (mặc định chọn mọi nền tảng đã hỗ trợ; ở story này chỉ Bài web); nút "Tạo bộ nội dung" chỉ bật khi hồ sơ *Đã duyệt*, đã chọn Góc viết và Người đọc, ≥ 1 nền tảng; khi tắt có dòng lý do điều kiện đầu tiên chưa đạt + `aria-describedby` (UX-DR47, UX-DR51)

**Given** điều kiện đủ
**When** chạm "Tạo bộ nội dung"
**Then** `suggestions` tạo `ContentSet` (+ `ContentSetProduct`, góc viết, người đọc; story có migration) và `Suggestion` `WEB_POST` ở `GENERATING`, chuyển tới `/cms/bo-noi-dung/[id]` (FR-12)
**And** AI tạo tiêu đề, tóm tắt, nội dung, thẻ, SEO title/description/keywords, Danh mục và Loại bài gợi ý theo Hồ sơ phong cách Website; thân bài không link, ảnh, giá, qua `sanitizePostHtml` (FR-11, FR-13, AD-22); prompt ở `modules/posts/prompts/web-post.prompt.ts`

**Given** màn Bộ nội dung
**When** mở trên 360px
**Then** một cột: đầu màn (Sản phẩm, Góc viết + hook, Người đọc, tiến độ "x/y đã duyệt"), thanh nhảy dính theo nền tảng, khối Bài web (UX-DR75)

**Given** gợi ý `WEB_POST` *Chờ duyệt*
**When** Vinh sửa rồi Duyệt
**Then** tạo `Post` nháp (khoá `ContentSet.postId`) gắn Sản phẩm của bộ; thẻ chuyển chỉ đọc (tiêu đề + tóm tắt) + "Mở bài web" → `/cms/bai-viet/[id]`; Soạn Bài web có link "← Bộ nội dung" (AD-19)
**And** Duyệt `WEB_POST` chỉ ghi vào `Post` còn `DRAFT`; bài đã xuất bản thì `UserError` và nút "Duyệt" tắt với lý do "Bài đã xuất bản — sửa tay ở Soạn Bài web"
**And** tạo bài nháp bằng AI cũ (`createPost` ở `/cms/bai-viet/moi`) bị gỡ theo `docs/cong-thuc/bo-chuc-nang.md`; soạn tay vẫn giữ

### Story 5.3: Bài Threads và Bình luận kèm link

As a Vinh,
I want AI viết chuỗi Threads và Bình luận kèm link Shopee trong cùng Bộ nội dung,
So that tôi có sẵn bài Threads để đăng tay.

**Acceptance Criteria:**

**Given** PlatformToggle có Threads (dòng phụ "kèm Bình luận kèm link")
**When** tạo Bộ nội dung có Threads
**Then** thêm hai `Suggestion` `THREADS_POST` và `LINK_COMMENT` (Threads), mỗi cái một lần gọi AI, chạy song song độc lập với Bài web; bình luận không chờ bài chính (FR-12, AD-18); story có migration tạo `SocialPost` (`@@unique([contentSetId, platform])`, `linkComment`, `styleProfileId`, `firstCopiedAt`, `postedAt`, `postUrl`)
**And** chuỗi theo Hồ sơ phong cách Threads, không cần Bài web trước; thân bài không có Link affiliate (FR-14)
**And** Bình luận chứa nguyên Link affiliate của (các) Sản phẩm, dẫn thẳng Shopee; có câu công khai nếu hồ sơ đã điền (FR-17, FR-18)

**Given** thẻ chuỗi Threads
**When** sửa
**Then** mỗi bài một khối có số "2/6", bộ đếm "182/500"; bài > 500 ký tự → bộ đếm đỏ, "Duyệt" tắt kèm lý do "Bài 3 vượt 500 ký tự"; không thêm/xoá bài trong chuỗi (UX-DR41)
**And** Duyệt → upsert `SocialPost` (Threads); Duyệt Bình luận khi bài Threads chưa Duyệt → nút tắt "Duyệt bài Threads trước", server trả `UserError` (AD-19)
**And** một phần lỗi thì thẻ đó báo "Chưa tạo được bài Threads. Phần khác vẫn giữ nguyên. Bấm Tạo lại." (UX-DR96)
**And** tab Threads cũ (`runThreads`, bài cuối chứa link website) bị gỡ; không còn mã nào dùng gói `openai` thì gỡ gói (NFR-1, QD-09)

### Story 5.4: Bài Facebook và Bình luận kèm link

As a Vinh,
I want AI viết Bài Facebook và Bình luận kèm link trong cùng Bộ nội dung,
So that một lần tạo có đủ ba nền tảng.

**Acceptance Criteria:**

**Given** PlatformToggle có Facebook
**When** tạo Bộ nội dung đủ 3 nền tảng
**Then** màn có 5 thẻ (Bài web; Threads + Bình luận; Facebook + Bình luận), chạy song song (FR-12, UX-DR75)
**And** Bài Facebook theo Hồ sơ phong cách Facebook, một bài khoảng 80–250 từ, xuống dòng dễ đọc trên điện thoại, không link trong thân (FR-15); thẻ có một `Textarea` + đếm từ
**And** Bình luận Facebook như Story 5.3; Duyệt cần bài Facebook đã Duyệt (AD-19)

**Given** bộ thiếu một nền tảng
**When** chạm dòng "Thêm Bài {nền tảng}"
**Then** tạo gợi ý mới vào cùng bộ (UX-DR75)

### Story 5.5: Copy một chạm và đánh dấu đã đăng

As a Vinh,
I want copy từng bài trong chuỗi và bình luận bằng một chạm, rồi đánh dấu đã đăng kèm link,
So that đăng tay nhanh và biết món nào đã lên nền tảng nào.

**Acceptance Criteria:**

**Given** CopyButton ở mỗi bài Threads, Bài Facebook, Bình luận
**When** chạm
**Then** nội dung vào clipboard, nút đổi "Đã sao chép" 2 giây (FR-19, UX-DR44)
**And** gợi ý chưa Duyệt: chạm lần đầu mở AlertDialog "Nội dung này chưa duyệt. Vẫn sao chép?" (FR-22)
**And** copy chưa Duyệt ghi `Suggestion.firstCopiedAt` qua `suggestions.recordSuggestionCopy`; Duyệt chép mốc sang `SocialPost.firstCopiedAt` nếu chưa có; copy sau Duyệt ghi qua `content-sets.recordCopy`; mỗi mốc chỉ ghi lần đầu (AD-21)

**Given** bài Threads/Facebook đã Duyệt
**When** chạm "Đánh dấu đã đăng", dán link (tuỳ chọn, kiểm URL)
**Then** `content-sets.markPosted` ghi `postedAt` + `postUrl`; badge "Đã đăng · dd/mm/yyyy" + link; bỏ đánh dấu được (FR-20, UX-DR56)
**And** `/cms/san-pham` và Chi tiết Sản phẩm hiện Sản phẩm đã lên nền tảng nào (FR-20)
**And** SM-3 tính được: `firstCopiedAt` sớm nhất của `ContentSet` − `Product.createdAt` của Sản phẩm đầu tiên (có query hoặc ghi chú cách đo trong `docs/`)

### Story 5.6: Cảnh báo rủi ro trong nội dung AI

As a Vinh,
I want AI đánh dấu câu có rủi ro kèm lý do và tôi chạm vào để tới đúng câu đó,
So that tôi sửa trước khi bài bị gỡ hay tài khoản bị khoá.

**Acceptance Criteria:**

**Given** gợi ý `WEB_POST`, `THREADS_POST`, `FACEBOOK_POST`, `LINK_COMMENT`
**When** AI trả kết quả
**Then** `riskWarnings` liệt kê câu thuộc: khẳng định công dụng y tế/mỹ phẩm/thực phẩm; cam kết tuyệt đối ("100%", "chắc chắn"); so sánh hạ thấp đối thủ; giá cụ thể trong thân bài; điểm có thể vi phạm nội quy Threads/Facebook — mỗi mục có câu và lý do (FR-23)
**And** RiskWarning hiện trên thân thẻ; chạm mục cuộn và highlight câu trong nội dung hoặc PostEditor; không chặn Duyệt (UX-DR43)

**Given** bộ ≥ 20 câu mẫu (câu vi phạm và câu bình thường) trong repo
**When** chạy script đo bằng tay (ngoài suite Vitest, gọi AI thật)
**Then** bắt ≥ 90% câu vi phạm, báo nhầm ≤ 20% câu bình thường; kết quả ghi vào `docs/kiem-chung.md` (FR-23, AD-16)

### Story 5.7: Tạo lại phần đã Duyệt và khoá Xuất bản

As a Vinh,
I want Tạo lại từng phần của Bộ nội dung kèm chỉ dẫn, và không lỡ xuất bản Bài web khi bản AI mới chưa Duyệt,
So that sửa một phần không làm hỏng phần khác.

**Acceptance Criteria:**

**Given** bất kỳ thẻ nội dung nào (kể cả đã Duyệt)
**When** chạm "Tạo lại" kèm chỉ dẫn
**Then** gợi ý cũ `SUPERSEDED`, gợi ý mới mang `parentSuggestionId`, các thẻ khác giữ nguyên (FR-21, AD-19)

**Given** Bài web có gợi ý `WEB_POST` ở Đang tạo / Chờ duyệt
**When** mở Soạn Bài web
**Then** nút "Xuất bản" tắt, dòng lý do "Cần duyệt bài AI trước khi xuất bản" + link về Bộ nội dung (FR-22, QD-08, UX-DR72)
**And** Screen màn soạn lấy trạng thái từ `suggestions/cms-queries` và truyền props; `posts` không import `suggestions` (AD-2, AD-19); khoá chỉ ở giao diện
**And** Cảnh báo rủi ro của gợi ý hiện trong PostEditor qua props với kiểu do `posts` định nghĩa

### Story 5.8: Bộ nội dung nhiều Sản phẩm (bài Gom link)

As a Vinh,
I want gom 2–3 Sản phẩm vào một Bộ nội dung,
So that tôi viết bài Gom link một lần cho nhiều món.

**Acceptance Criteria:**

**Given** CreateContentSetPanel
**When** "Thêm Sản phẩm (bài Gom link)" qua ProductPicker
**Then** danh sách "Sản phẩm trong bộ" có Sản phẩm hiện tại đầu tiên + StatusBadge hồ sơ từng món; món chưa có hồ sơ *Đã duyệt* → nút tắt, lý do "'{tên}' chưa có hồ sơ đã duyệt" kèm link (UX-DR47)
**And** AnglePicker và AudiencePicker liệt kê lựa chọn từ mọi hồ sơ, nhóm theo Sản phẩm (FR-10, UX-DR46)

**Given** bộ 3 Sản phẩm
**When** tạo
**Then** Bình luận kèm link chứa Link affiliate của cả 3; Bài web gắn cả 3 Sản phẩm sau Duyệt (FR-17, Flow 5)

### Story 5.9: Chuyển Bài web có sẵn thành bài mạng xã hội

As a Vinh,
I want từ một Bài web đã có tạo Bài Threads và/hoặc Facebook,
So that bài cũ cũng có nội dung mạng xã hội.

**Acceptance Criteria:**

**Given** Soạn Bài web, nút "Tạo bài mạng xã hội"
**When** mở Dialog chọn Threads / Facebook
**Then** nền tảng đã có trong bộ hiện "Đã có", không chọn được; bài chưa gắn Sản phẩm → nút tắt, lý do "Gắn ít nhất một Sản phẩm để có Link affiliate cho Bình luận" (UX-DR55)

**Given** Vinh xác nhận
**When** bài đã thuộc Bộ nội dung
**Then** tạo gợi ý vào bộ đó; chưa thuộc → tạo Bộ nội dung mới gắn Bài web và Sản phẩm của bài, dùng nội dung bài làm nguồn; chuyển tới `/cms/bo-noi-dung/[id]`, thẻ mới ở Đang tạo, Bài web hiện ở trạng thái đã có (FR-16, Flow 7)
**And** bài theo Hồ sơ phong cách từng nền tảng, kèm Bình luận kèm link

## Epic 6: Trang bio

Người đọc từ Threads/Facebook vào `/bio`, lọc theo Danh mục và mua; Vinh chọn món hiện, ghim, sắp thứ tự. Xong epic này UJ-1 trọn (Sản phẩm tự lên `/bio`). Cần Epic 2, Epic 3.

### Story 6.1: Trang bio public

As a người đọc từ Threads,
I want một trang ngắn có mọi món đang bán, nhóm và lọc theo Danh mục,
So that tôi mua thêm món khác trong vài chạm.

**Acceptance Criteria:**

**Given** `/bio` (module `bio`)
**When** mở trên 360px
**Then** một cột: giới thiệu + link "Về trang chủ" (link tuỳ chỉnh duy nhất) → AffiliateDisclosure luôn hiện, không đóng được → FilterChips → danh sách ProductCard *row*; desktop căn giữa rộng tối đa 560px (FR-30, UX-DR66)
**And** chip "Tất cả": nhóm "Nổi bật" (Sản phẩm ghim, theo thứ tự bio) trước, rồi mỗi Danh mục một nhóm theo thứ tự hiển thị kèm số món; Sản phẩm ghim không lặp ở nhóm Danh mục
**And** chip một Danh mục: danh sách phẳng, ghim lên đầu, giữ dấu Ghim; lọc phía client tức thì, không đổi URL; chip chỉ gồm Danh mục có món (UX-DR30)
**And** mỗi ProductCard qua `AffiliateLink` (FR-25); Sản phẩm ẩn không bao giờ hiện, biến mất ≤ 1 phút (FR-5, QD-16)

**Given** `BioItem` tạo lười
**When** Sản phẩm chưa có bản ghi `BioItem`
**Then** coi là hiện, không ghim; thứ tự: ghim theo thứ tự đặt, rồi theo `Product.createdAt` mới nhất; `products` không ghi `BioItem` (spine, bảng chủ sở hữu)
**And** story có migration tạo `BioSettings`, `BioItem` (chủ `bio`)
**And** query đặt ở `bio` (tầng cao nhất chạm bảng), gắn tag `bio` + `products` + `categories` (AD-2, AD-7); có sitemap, không JSON-LD (AD-26)

**Given** chưa có món nào
**When** mở `/bio`
**Then** vẫn hiện giới thiệu + AffiliateDisclosure + link Trang chủ, EmptyState "Sắp có đồ hay, ghé lại sau nhé"
**And** không ô tìm, không link MXH/@handle, không khối "Bài mới nhất" (UX-DR66, UX-DR99)

### Story 6.2: Quản lý Trang bio trong CMS

As a Vinh,
I want sửa giới thiệu, câu chữ nhãn công khai, chọn món hiện, ghim và sắp thứ tự,
So that trang bio luôn đưa món đáng mua lên đầu.

**Acceptance Criteria:**

**Given** `/cms/bio`
**When** mở
**Then** ô giới thiệu, câu chữ Nhãn công khai affiliate (sửa được, không tắt được), BioProductList mọi Sản phẩm đang hiện (Sản phẩm ẩn không có) (FR-31, UX-DR80, UX-DR49)
**And** mỗi dòng: ảnh 40px, tên, `Switch` "Hiện trên bio" (Sản phẩm mới mặc định bật), nút Ghim, lên/xuống trong nhóm "Đang ghim" và nhóm còn lại; lưu từng thao tác ngay + Toast "Đã lưu"
**And** thay đổi thấy trên `/bio` ≤ 1 phút (`updateTag` tag `bio`)

### Story 6.3: Dải "Gom link đồ xinh" trên Trang chủ

As a người đọc,
I want thấy vài món nổi bật ngay Trang chủ,
So that tôi khám phá đồ hay mà không cần vào `/bio`.

**Acceptance Criteria:**

**Given** Trang chủ
**When** có Sản phẩm đang hiện trên bio
**Then** khu "Gom link đồ xinh" ở vị trí theo UX-DR62: dải ProductCard *tile* cuộn ngang snap, tối đa 8 món theo thứ tự ghim/sắp xếp của bio, dòng AffiliateDisclosure ngắn dưới tiêu đề, "Xem tất cả" → `/bio`
**And** không có món → ẩn khu, không chừa chỗ
**And** query gắn tag `bio` + `products` (AD-7)

## Epic 7: Đo Lượt xem

Mỗi Bài web đếm Lượt xem ẩn danh (không đếm Vinh, không đếm bot); danh sách bài CMS hiện và sắp xếp theo Lượt xem. Cần Epic 3.

### Story 7.1: Đếm Lượt xem ẩn danh

As a Vinh,
I want biết mỗi bài có bao nhiêu lượt xem thật,
So that tôi biết loại bài nào kéo người đọc (SM-4).

**Acceptance Criteria:**

**Given** trang bài đã xuất bản (tĩnh)
**When** người đọc mở bài
**Then** phía client gọi action công khai `engagement/actions.ts` một lần mỗi trình duyệt mỗi bài (chống trùng bằng `localStorage`); action validate, giới hạn tần suất trong bộ nhớ theo băm IP ngắn hạn, không ghi định danh vào DB/log, không `updateTag` (FR-33, AD-6, AD-23, NFR-7, QD-18)
**And** story có migration tạo `PostStat { postId, views, likes }` (upsert lười) và `PostViewDaily { postId, day, views }` (chủ `engagement`)
**And** mức giới hạn tần suất cụ thể được chốt và ghi trong story (Deferred của spine)

**Given** trình duyệt của Vinh đã vào `/cms`
**When** Vinh mở bài public
**Then** không gửi lượt xem (trình duyệt tự đánh dấu khi vào `/cms`); user-agent bot phổ biến bị bỏ qua (FR-33)
**And** đếm lượt xem không làm chậm hiển thị nội dung chính (NFR-5); có test tích hợp cho service ghi lượt xem

### Story 7.2: Lượt xem trong danh sách bài CMS

As a Vinh,
I want thấy và sắp xếp bài theo Lượt xem trong CMS,
So that tôi biết bài nào đang hút người đọc.

**Acceptance Criteria:**

**Given** `/cms/bai-viet`
**When** mở danh sách
**Then** mỗi bài có cột Lượt xem (`formatCount`), bài chưa có lượt xem hiện 0 (FR-38, UX-DR71)
**And** sắp xếp theo Lượt xem qua tham số URL; query đặt ở `engagement` (xếp theo Lượt xem — AD-2), Screen ghép với danh sách bài
**And** cột Lượt tim thêm ở Epic 8 (Story 8.1)

## Epic 8: Người đọc tương tác (giai đoạn 1.5)

Người đọc thả tim, tìm kiếm không dấu, chia sẻ bài; Trang chủ và 404 có Xem nhiều; CMS thêm cột Lượt tim. Cần Epic 7 cho Xem nhiều.

### Story 8.1: Thả tim bài viết

As a người đọc,
I want thả tim bài hay mà không cần đăng nhập,
So that tôi bày tỏ thích bài và Vinh biết bài nào được yêu thích.

**Acceptance Criteria:**

**Given** trang bài (cuối bài, ArticleActionBar mobile, cột phải desktop)
**When** chạm LikeButton
**Then** đổi trạng thái ngay (optimistic) + số ±1; chạm lại bỏ tim; trạng thái nhớ theo trình duyệt (`localStorage`); mỗi trình duyệt một tim mỗi bài (FR-35, UX-DR25, AD-23)
**And** số tim tải phía client qua action đọc của `engagement`; chưa có số / lỗi thì giữ chỗ cố định, hiện "—", vẫn bấm được
**And** giới hạn ≤ 30 lần thả tim/phút từ cùng một nguồn (băm IP trong bộ nhớ, không lưu định danh); bị giới hạn / lỗi → hoàn trạng thái + Toast "Chưa thả tim được, thử lại sau nhé" (FR-35, NFR-7, QD-18)
**And** hiệu ứng nảy ≤ 200 ms, tắt khi reduced-motion

**Given** `/cms/bai-viet`
**When** mở danh sách
**Then** có cột Lượt tim, sắp xếp được (FR-38)

### Story 8.2: Chia sẻ bài viết

As a người đọc,
I want chia sẻ bài lên Facebook, Threads hoặc sao chép link,
So that tôi gửi mẹo hay cho bạn bè.

**Acceptance Criteria:**

**Given** ShareButtons (cuối bài, ArticleActionBar, cột phải desktop)
**When** chạm
**Then** Facebook/Threads mở trang chia sẻ ở tab mới; "Sao chép link" ghi URL canonical + Toast "Đã sao chép liên kết"; clipboard bị chặn → Toast "Chưa sao chép được, bạn giữ ngón tay lên thanh địa chỉ để chép nhé" (FR-37, UX-DR26)
**And** mobile có `navigator.share`: nút chia sẻ chính mở chia sẻ gốc; người dùng huỷ → không làm gì
**And** nút tròn 44px, `aria-label` tiếng Việt; Toast site theo UX-DR36

### Story 8.3: Tìm kiếm không dấu

As a người đọc,
I want gõ "noi chien" vẫn ra bài "nồi chiên",
So that tôi tìm mẹo nhanh trên điện thoại.

**Acceptance Criteria:**

**Given** story có migration thêm `Post.searchText` do `posts/service.ts` ghi khi lưu bài (bỏ dấu, chữ thường) và backfill bài cũ
**When** người đọc gõ ≥ 2 ký tự ở `/tim-kiem`
**Then** sau 300 ms ngừng gõ (Enter tìm ngay) gọi `posts.searchPosts` — action công khai chỉ đọc, giới hạn tần suất, chỉ bài đã xuất bản, không ghi log từ khoá (FR-36, AD-6, NFR-7); mức giới hạn chốt trong story
**And** kết quả: "Tìm thấy N bài viết cho "…"" (`aria-live`) + SearchResultItem (PostCard *row*, highlight từ khớp) (UX-DR31, UX-DR32)
**And** không kết quả: EmptyState "Chưa tìm thấy mẹo nào phù hợp với từ khoá này rồi..." + gợi ý gõ ngắn hơn

**Given** `/tim-kiem` (noindex) chưa gõ
**When** mở từ nút tìm trên SiteHeader
**Then** SearchBox tự focus + FilterChips mỗi Danh mục có Bài web đã xuất bản (không "Tất cả", không số), chạm chip → `/[danh-muc]` (UX-DR30, UX-DR67)
**And** trang tĩnh, không đọc `searchParams` ở server (AD-7)

### Story 8.4: Khu "Xem nhiều" trên Trang chủ và 404

As a người đọc,
I want thấy bài được đọc nhiều nhất gần đây,
So that tôi đọc ngay bài đáng đọc.

**Acceptance Criteria:**

**Given** `PostViewDaily` (Epic 7)
**When** mở Trang chủ
**Then** khu "Xem nhiều" hiện tối đa 5 bài nhiều Lượt xem nhất trong 30 ngày gần nhất, PostCard *rank* `01`–`05` trong `<ol>`; < 5 hiện số có, 0 thì ẩn khu; vị trí theo UX-DR62 (desktop cạnh Bài nổi bật) (FR-34)
**And** query đặt ở `engagement`, `"use cache"` với `cacheLife` cố định, không `updateTag` mỗi lượt xem (AD-23, AD-2)

**Given** trang 404 site
**When** vào đường dẫn không có
**Then** thêm SearchBox và 3 bài Xem nhiều dưới EmptyState (UX-DR68)

## Epic 9: Banner khuyến mãi (giai đoạn 1.5)

Vinh đặt Banner có lịch (dịp 11.11); site chỉ hiện Banner đang bật và trong khung giờ. Cần Epic 2 (`AffiliateLink`, UploadField).

**Điều kiện tiên quyết:** đã chốt backend lưu file (Story 2.8 xong).

### Story 9.1: Quản lý Banner có lịch trong CMS

As a Vinh,
I want tạo Banner với ảnh, tiêu đề, mô tả, link đích, thứ tự, bật/tắt và lịch hiển thị,
So that tôi chạy khuyến mãi theo dịp mà không phải nhớ tắt tay.

**Acceptance Criteria:**

**Given** `/cms/banner` (module `banners`)
**When** tạo/sửa Banner
**Then** UploadField hiện tỉ lệ ảnh khuyến nghị; link đích sang Shopee phải là domain Shopee chính chủ (FR-32, FR-25); story có migration tạo `Banner`
**And** StatusBadge Tắt / Chờ lịch / Hết hạn / Đang hiện, tính bằng một hàm duy nhất của `banners` dùng cho cả CMS và public, giờ `Asia/Ho_Chi_Minh` (AD-7, UX-DR79)
**And** CmsShell thêm mục "Banner"

### Story 9.2: Banner trên Trang chủ

As a người đọc,
I want thấy banner khuyến mãi đang diễn ra ở đầu Trang chủ,
So that tôi không bỏ lỡ dịp giảm giá.

**Acceptance Criteria:**

**Given** Banner đang bật và trong lịch
**When** mở Trang chủ
**Then** khu Banner ở đầu trang; ≥ 2 banner là dải cuộn ngang snap có chấm vị trí, không tự chạy; cả Banner là một link (Shopee qua `AffiliateLink`, nội bộ là link thường cùng tab); không vỡ ở 360px; ảnh lỗi → ImageFallback (UX-DR15)
**And** 0 banner → không render, không chừa chỗ, Bài nổi bật lên đầu (UX-DR62)
**And** query lấy "now" bên trong hàm `"use cache"`, revalidate ≤ 60 giây, không lọc lịch phía client (AD-7); banner hết hạn biến khỏi site ≤ 1 phút, không deploy lại

## Epic 10: Kho Cảm hứng (giai đoạn 1.5)

Vinh lưu video/link mẹo ban ngày; tối AI gợi ý từ khoá Shopee và dàn ý; gắn Sản phẩm rồi đi tiếp như UJ-1. Cần Epic 4, Epic 5.

**Điều kiện tiên quyết:** backend lưu file (Story 2.8) trước Story 10.1; cách đọc video từ link (Deferred) trước Story 10.2 — chưa chốt thì `skipped` có `video` và AI làm với tiêu đề + ghi chú.

### Story 10.1: Lưu Cảm hứng nhanh

As a Vinh,
I want dán link TikTok/Pinterest/Shopee hoặc tải video/ảnh kèm một dòng ghi chú,
So that ý tưởng ban ngày không bị quên.

**Acceptance Criteria:**

**Given** `/cms/cam-hung` (module `inspirations`)
**When** chạm "Lưu cảm hứng", dán link, thêm ghi chú, Lưu
**Then** tạo Cảm hứng dưới 3 lần chạm sau khi dán; chỉ cần một link, các trường khác để trống (FR-1, UX-DR76); story có migration tạo `Inspiration`
**And** tải file video hoặc ảnh qua UploadField, video ≤ 100 MB
**And** danh sách lọc Mới / Đã dùng / Bỏ qua qua tham số URL; *Đã dùng* suy ra từ `ContentSet`, không lưu cột (spine)
**And** CmsShell thêm mục "Cảm hứng"

### Story 10.2: Từ Cảm hứng tới Bộ nội dung

As a Vinh,
I want AI gợi ý từ khoá tìm trên Shopee và dàn ý bài từ một Cảm hứng, rồi gắn Sản phẩm và tạo bài,
So that video mẹo biến thành nội dung bán hàng.

**Acceptance Criteria:**

**Given** `/cms/cam-hung/[id]`
**When** chạm "Nghiên cứu"
**Then** `Suggestion` `RESEARCH` gắn `inspirationId`: từ khoá tìm trên Shopee + dàn ý bài mẹo, Duyệt/Tạo lại như Epic 4; AI dùng tiêu đề, chú thích, ghi chú, khung hình nếu có file; không đọc được video → thông báo rõ, gợi ý tải file video lên (FR-2, UX-DR77, AD-10)

**Given** InspirationActions
**When** "Gắn sản phẩm" → "Tạo Sản phẩm mới" hoặc "Chọn Sản phẩm có sẵn"
**Then** mở `/cms/san-pham/moi?cam-hung=<id>` hoặc `/cms/san-pham/[id]?cam-hung=<id>`; Chi tiết Sản phẩm hiện dải "Từ Cảm hứng: …" (UX-DR61, UX-DR47)
**And** "Bỏ qua" đặt *Bỏ qua* một chạm + Toast "Hoàn tác"; Cảm hứng *Bỏ qua* có "Đưa lại vào Mới"

**Given** Vinh tạo Bộ nội dung từ Sản phẩm mở kèm `?cam-hung`
**When** bộ được tạo
**Then** `ContentSet.inspirationId` được ghi; Cảm hứng thành *Đã dùng* và chi tiết hiện link tới Bộ nội dung (FR-2, UJ-2)

## Epic 11: Nhập Bài web từ URL (giai đoạn 1.5)

Vinh dán URL một bài viết bên ngoài; AI đọc trang và điền sẵn tiêu đề, tóm tắt, thân bài vào trình soạn; Vinh sửa tay hoặc bấm "AI chỉnh sửa". Không đổi schema. Cần Epic 3, Epic 4, Epic 5.

### Story 11.1: Nhập nội dung từ URL vào trình soạn

As a Vinh,
I want dán URL một bài viết để tiêu đề, tóm tắt và thân bài được điền sẵn,
So that tôi không phải copy tay từng đoạn.

**Acceptance Criteria:**

**Given** `/cms/bai-viet/moi`
**When** dán URL `http(s)` vào khối "Nhập từ URL", chạm "Lấy nội dung"
**Then** `posts.importPostFromUrl` qua `run()` validate URL (Zod ở `posts/schema.ts`, độ dài ở `posts/constants.ts`), gọi `ask()` với prompt `modules/posts/prompts/import-post.prompt.ts` và `webSearch: true`; máy chủ không tự fetch URL (spine AD-9 ngoại lệ có tên); chưa ghi gì vào DB
**And** kết quả `{ title, summary, contentHtml, imageUrls[] }`: `contentHtml` qua `sanitizePostHtml` trước khi trả về; tiêu đề/tóm tắt cắt theo giới hạn trong `posts/constants.ts`
**And** màn hiện form bài đầy đủ đã điền sẵn (Loại bài, Danh mục, tiêu đề, tóm tắt, PostEditor, ảnh đại diện, thẻ, SEO) theo `postDraftInputSchema`, qua CmsForm + UnsavedChangesGuard; khối "Ảnh trong bài gốc" liệt kê `imageUrls` (link + nút copy), không tự tải ảnh, không gán ảnh đại diện

**Given** form nhập đã điền
**When** chạm "Lưu nháp"
**Then** gọi `posts.createPostDraft` (đã có) với giá trị form, rồi chuyển sang `/cms/bai-viet/[id]`; không có bản nháp trống nào được tạo trước đó

**Given** form nhập đã có nội dung
**When** lấy lại từ URL khác
**Then** ConfirmDialog "Ghi đè nội dung đang soạn?" trước khi gọi action

**Given** trang không đọc được (AI báo không đọc được, hoặc `skipped` chứa `webSearch`)
**When** action kết thúc
**Then** `UserError` tiếng Việt tại dialog, gợi ý copy nội dung dán vào trình soạn; URL vẫn giữ trong ô

**And** dialog có dòng nhắc viết lại trước khi xuất bản (R-9); test prompt + action với `AI_PROVIDERS=fake`

### Story 11.2: AI chỉnh sửa nội dung trong trình soạn

As a Vinh,
I want bấm "AI chỉnh sửa" kèm chỉ dẫn ngắn để AI viết lại bài đang soạn theo giọng của trang,
So that bài nhập về thành bài của tôi.

**Acceptance Criteria:**

**Given** form nhập từ URL ở `/cms/bai-viet/moi` (Story 11.1) hoặc trình soạn `/cms/bai-viet/[id]`, thân bài không rỗng
**When** chạm "AI chỉnh sửa", nhập chỉ dẫn tuỳ chọn, chạm "Viết lại"
**Then** `posts.rewritePostDraft` qua `run()` gửi tiêu đề, tóm tắt, thân bài hiện tại (chưa cần lưu) + chỉ dẫn; prompt `modules/posts/prompts/rewrite-post.prompt.ts` lấy Hồ sơ phong cách Website và `platform/ai/rules.ts`; kết quả `{ title, summary, contentHtml, riskWarnings }`, `contentHtml` qua `sanitizePostHtml`
**And** form được điền, chưa lưu; Toast "Đã viết lại" có "Hoàn tác" trả form về đúng nội dung trước lần viết lại; Cảnh báo rủi ro hiện qua RiskWarningList

**Given** AI lỗi hoặc quá 90 giây
**When** action kết thúc
**Then** `UserError` tiếng Việt, nội dung form không đổi (NFR-2, NFR-3)

**And** test prompt + action với `AI_PROVIDERS=fake`
