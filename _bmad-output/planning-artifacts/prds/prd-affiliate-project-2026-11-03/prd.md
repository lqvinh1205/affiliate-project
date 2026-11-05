---
title: PRD — affiliate-project (Mẹo Vặt Cuộc Sống & Gom Link)
status: final
created: 2026-11-03
updated: 2026-11-03
---

# PRD: Mẹo Vặt Cuộc Sống — Xưởng nội dung affiliate có AI
*Thương hiệu: Mẹo Vặt Cuộc Sống, tên miền dự kiến `meovatcuocsong.vn` (Vinh xác nhận 2026-11-03).*

## 0. Mục đích tài liệu

PRD này dành cho Vinh (chủ dự án, người vận hành duy nhất) và các bước tiếp theo trong BMad: UX, kiến trúc, epics/stories. Tài liệu mô tả **sản phẩm cần làm được gì**, không mô tả cách làm. Chi tiết kỹ thuật (lớp gọi AI, phương án nhà cung cấp) nằm ở `addendum.md`. Bối cảnh thị trường và pháp lý nằm ở `research-landscape.md`. Thuật ngữ dùng thống nhất theo §3. Tính năng được nhóm ở §4; yêu cầu chức năng (FR) đánh số liên tục. Những chỗ suy luận chưa xác nhận được đánh dấu `[ASSUMPTION]` và liệt kê ở §11.

Tài liệu cũ `docs/PRD_AFFILIATE_PROJECT.md` chỉ là ý tưởng ban đầu và đã lỗi thời. PRD này thay thế nó. Code hiện tại (commit `dfd7e8f`) đã có website public hai loại bài (Mẹo vặt, Gom link), CMS có AI viết bài, chấm SEO và chuyển bài thành chuỗi Threads. PRD này xây tiếp trên nền đó. Những gì đang chạy và phải giữ được liệt kê ở FR-26, FR-27 và NFR-8.

## 1. Tầm nhìn

Vinh muốn kiếm tiền từ hoa hồng Shopee Affiliate, với người đọc đến chủ yếu từ Threads và Facebook. Vinh chỉ có khoảng **một giờ mỗi ngày** cho toàn bộ việc tìm sản phẩm, viết và đăng bài. Nếu làm thủ công, một giờ chỉ đủ cho một bài làm vội.

Sản phẩm này là **xưởng nội dung có AI** của Vinh. Vinh nạp vào những gì gom được: link video TikTok/Pinterest, link sản phẩm Shopee, ảnh, đoạn mô tả, đánh giá. AI tìm thêm thông tin, suy ra ai sẽ thích sản phẩm, gợi ý góc viết, rồi viết sẵn một **bộ nội dung** gồm bài web, bài Threads, bài Facebook và câu bình luận chứa link affiliate. Mỗi bài theo giọng văn và nội quy riêng của nền tảng. AI chỉ đề xuất. Vinh duyệt, sửa, copy rồi tự đăng.

Người đọc từ Threads/Facebook bấm link trong bình luận sang thẳng Shopee, hoặc vào **trang bio** gắn trên hồ sơ Threads/FB để xem toàn bộ sản phẩm Vinh giới thiệu, chia theo danh mục. Website là kênh traffic thứ hai, chủ yếu từ Google, và là nơi tạo **uy tín**: một blog đời sống đầy đủ, có danh mục, banner, bài xem nhiều, tìm kiếm, thả tim và chia sẻ.

## 2. Người dùng mục tiêu

### 2.1 Jobs To Be Done

**Vinh, người vận hành:**
- Biến một món đồ hay hoặc một video mẹo vừa thấy thành bộ nội dung sẵn sàng cho 3 nền tảng trong **dưới 20 phút**.
- Không phải tự nghĩ góc viết, tự tìm thông tin hay tự viết lại cho từng nền tảng.
- Yên tâm rằng nội dung AI viết không nói quá công dụng và không vi phạm nội quy nền tảng.
- Có một nơi duy nhất quản lý mọi sản phẩm và link affiliate, kèm trang bio để gắn lên hồ sơ mạng xã hội.
- Có một website trông chuyên nghiệp để tăng uy tín và đón thêm người đọc từ Google.
- Biết bài nào được đọc nhiều để làm thêm chủ đề tương tự.

**Người đọc:**
- Tìm được mẹo hữu ích hoặc món đồ hay, đúng nhu cầu, được giới thiệu tự nhiên chứ không như quảng cáo lộ liễu.
- Mua nhanh qua một link.

### 2.2 Không phải người dùng (v1)
- Cộng tác viên hay biên tập viên khác. CMS chỉ có một người vận hành.
- Người đọc có tài khoản. Website không có đăng ký hay đăng nhập cho người đọc.

### 2.3 Hành trình chính

- **UJ-1. Vinh biến một món đồ trên Shopee thành bộ nội dung 3 nền tảng.**
  - **Bối cảnh:** buổi tối, Vinh có một giờ. Đang lướt Shopee thì thấy một món đồ bếp mini đang bán chạy.
  - **Điểm vào:** CMS trên điện thoại, đã đăng nhập.
  - **Các bước:**
    1. Vinh tạo link affiliate trên trang Shopee Affiliate.
    2. Vinh mở CMS, tạo **Sản phẩm** mới: dán tên, link affiliate, giá, vài ảnh và đoạn mô tả copy từ Shopee.
    3. Vinh bấm "Nghiên cứu". AI tìm thêm thông tin trên web, đọc ảnh, tóm tắt các đánh giá Vinh dán vào, suy ra **người đọc mục tiêu** ("người ở trọ, nấu ăn một mình") và đưa ra 3 **góc viết**.
    4. Vinh chọn một góc viết và bấm "Tạo bộ nội dung". AI tạo **bài web**, **bài Threads**, **bài Facebook** và **bình luận kèm link** trong một lần.
  - **Cao trào:** cả bộ nội dung hiện ra trong một màn hình, có cảnh báo rủi ro (ví dụ "câu 'diệt 99% vi khuẩn' chưa có căn cứ"). Vinh sửa một câu, duyệt, xuất bản bài web, rồi copy bài Threads và câu bình luận đi đăng.
  - **Kết quả:** Vinh đánh dấu đã đăng Threads/FB. Sản phẩm tự xuất hiện trên trang bio. Toàn bộ mất khoảng 15 phút. Vinh còn thời gian cho sản phẩm thứ hai.
  - **Tình huống lỗi:** AI không tìm được thông tin nào. Vinh vẫn tạo bài được từ dữ liệu đã nạp, và hệ thống báo rõ là AI không có thêm nguồn.

- **UJ-2. Vinh đi từ một video mẹo trên TikTok đến sản phẩm.**
  - **Bối cảnh:** ban ngày, Vinh thấy video "mẹo gấp quần áo bằng khay nhựa" nhưng chưa có thời gian làm bài.
  - **Các bước:**
    1. Vinh lưu một **Cảm hứng** bằng cách dán link video (hoặc tải video về máy rồi đưa vào CMS), kèm một dòng ghi chú.
    2. Buổi tối, Vinh mở Cảm hứng. AI gợi ý **từ khoá tìm trên Shopee** và **dàn ý bài mẹo**.
    3. Vinh lên Shopee tìm sản phẩm, tạo link affiliate, rồi gắn sản phẩm vào. Từ đây hành trình đi tiếp như UJ-1.
  - **Kết quả:** Cảm hứng chuyển sang trạng thái "đã dùng" và liên kết với bộ nội dung được tạo ra.

- **UJ-3. Người đọc từ Threads mua hàng.**
  - Một người lướt Threads lúc nghỉ trưa thì gặp bài của Vinh. Câu mở đầu đúng vấn đề họ đang gặp, nên họ đọc hết chuỗi, mở bình luận và bấm **link affiliate** sang thẳng Shopee để mua. Hôm sau họ bấm link trên hồ sơ của Vinh, vào **trang bio**, lọc danh mục "Nhà bếp" và mua thêm một món. *[ASSUMPTION: chân dung người đọc chưa rõ; AI suy ra theo từng sản phẩm. Viết lại hành trình này sau khi có dữ liệu thật.]*

- **UJ-4. Người đọc từ Google khám phá website.**
  - Một người tìm "mẹo tẩy ố nồi chiên không dầu" trên Google và vào bài web. Họ thả tim, bấm sang bài liên quan cùng danh mục, tìm thêm bằng ô tìm kiếm, rồi bấm link sản phẩm trong bài. Vì bài có nhãn công khai affiliate, họ thấy trang minh bạch và đáng tin.

## 3. Thuật ngữ

- **Người vận hành**: Vinh, người duy nhất dùng CMS.
- **Người đọc**: người xem website, trang bio hoặc bài trên Threads/Facebook. Ẩn danh, không có tài khoản.
- **Cảm hứng**: một ý tưởng thô được lưu lại, gồm link (TikTok, Pinterest, Shopee, khác), file video hoặc ảnh tải lên, và ghi chú. Trạng thái: *mới*, *đã dùng*, *bỏ qua*. Một Cảm hứng có thể dẫn tới 0..n Bộ nội dung.
- **Sản phẩm**: món hàng trên Shopee mà Vinh giới thiệu. Gồm tên, ảnh, giá tham khảo, **Link affiliate**, **Danh mục** và **Dữ liệu thô**. Trạng thái: *hiện* hoặc *ẩn*. Là bản ghi dùng chung: mọi nơi hiển thị Sản phẩm (Bài web, Trang bio) luôn lấy dữ liệu mới nhất.
- **Link affiliate**: link Shopee Affiliate do Vinh tạo thủ công trên trang Shopee Affiliate. Thuộc domain Shopee chính chủ.
- **Dữ liệu thô**: mọi thứ Vinh nạp cho một Sản phẩm: văn bản, ảnh, đánh giá dán vào.
- **Hồ sơ nghiên cứu**: kết quả AI tạo cho **một** Sản phẩm hoặc Cảm hứng. Gồm thông tin tìm được (kèm nguồn), mô tả từ ảnh, tóm tắt đánh giá, Người đọc mục tiêu, các Góc viết.
- **Người đọc mục tiêu**: nhóm người AI suy ra là hợp với Sản phẩm, dùng để định hướng giọng văn.
- **Góc viết**: một cách tiếp cận hoặc câu mở đầu (hook) cho bài, ví dụ "quà dưới 100k", "mẹo cho người ở trọ".
- **Bộ nội dung**: những gì AI tạo ra từ một lần chọn Góc viết, gồm tối đa một Bài web, một Bài Threads, một Bài Facebook và Bình luận kèm link. Gắn với 1..n Sản phẩm, và tuỳ chọn một Cảm hứng.
- **Loại bài**: kiểu viết của Bài web: *Mẹo vặt* (trọng tâm là cách làm) hoặc *Gom link* (tổng hợp, review sản phẩm). Tách riêng với Danh mục: Loại bài là kiểu viết, Danh mục là chủ đề.
- **Danh mục**: nhóm chủ đề do Vinh tạo trong CMS, ví dụ "Nhà bếp", "Làm đẹp". Mỗi Bài web và mỗi Sản phẩm thuộc một Danh mục.
- **Bài web**: bài viết đăng trên website. Trạng thái: *nháp*, *đã xuất bản*.
- **Bài mạng xã hội**: nội dung cho một nền tảng (**Bài Threads** hoặc **Bài Facebook**), có thể là một bài hoặc một chuỗi. Thuộc một Bộ nội dung. Trạng thái đăng: *chưa đăng*, *đã đăng*.
- **Bình luận kèm link**: câu bình luận chứa Link affiliate, để Vinh dán vào bình luận đầu tiên khi đăng.
- **Hồ sơ phong cách**: bộ quy tắc giọng văn, độ dài, cách dùng emoji và nội quy cho một nền tảng (Website, Threads, Facebook). Vinh chỉnh được.
- **Trang bio**: trang public trên website, dành để gắn link vào hồ sơ Threads/Facebook. Liệt kê các Sản phẩm đang *hiện*, chia theo Danh mục, mỗi Sản phẩm dẫn tới Link affiliate.
- **Gợi ý AI**: một phần nội dung AI tạo ra (xem FR-22). Trạng thái: *chờ duyệt*, *đã duyệt*, *đã từ chối*.
- **Duyệt**: hành động Vinh chấp nhận một Gợi ý AI, có thể sau khi sửa.
- **Cảnh báo rủi ro**: ghi chú AI gắn vào Gợi ý AI khi phát hiện khẳng định công dụng thiếu căn cứ, lời cam kết, hoặc nội dung có thể vi phạm nội quy nền tảng hay luật quảng cáo.
- **Nhãn công khai affiliate**: dòng thông báo bài có chứa link tiếp thị liên kết.
- **Banner**: khối hình ảnh và thông điệp trên website, do Vinh quản lý.
- **Lượt xem**: số lần một Bài web được mở.
- **Lượt tim**: số lần người đọc thả tim một Bài web.

## 4. Tính năng

### 4.1 Kho cảm hứng

**Mô tả:** nơi Vinh lưu nhanh ý tưởng khi chưa có thời gian làm bài. Thực hiện UJ-2. Thao tác lưu phải nhanh trên điện thoại: dán link và một dòng ghi chú là đủ.

#### FR-1: Lưu Cảm hứng
Người vận hành có thể tạo Cảm hứng từ một link, một file video hoặc ảnh tải lên, và ghi chú tuỳ chọn. Thực hiện UJ-2.
- Tạo được Cảm hứng chỉ với một link, các trường khác để trống.
- Tải được video hoặc ảnh từ thiết bị. *[ASSUMPTION: giới hạn khoảng 100 MB/file; kiến trúc chọn nơi lưu.]*
- Danh sách Cảm hứng lọc được theo trạng thái *mới / đã dùng / bỏ qua*.

#### FR-2: Biến Cảm hứng thành bài
Người vận hành có thể yêu cầu AI tạo Hồ sơ nghiên cứu từ một Cảm hứng, gồm từ khoá gợi ý để tìm trên Shopee và dàn ý bài. Sau đó Vinh gắn Sản phẩm và tạo Bộ nội dung. Thực hiện UJ-2.
- Bộ nội dung tạo từ Cảm hứng ghi lại liên kết tới Cảm hứng đó, và Cảm hứng chuyển sang *đã dùng*.
- Với link video, AI làm việc với những gì đọc được (tiêu đề, chú thích, ghi chú, khung hình nếu có file). Khi không đọc được nội dung video, hệ thống báo rõ cho Vinh.

**Ghi chú:** đọc nội dung video TikTok/Pinterest từ link có thể bị nền tảng chặn. Kiến trúc cần xác định mức khả thi (Câu hỏi mở 3).

### 4.2 Kho sản phẩm

**Mô tả:** Sản phẩm được lưu riêng, dùng lại cho nhiều Bài web và hiển thị trên Trang bio. Đây là nơi duy nhất quản lý Link affiliate. Vinh nạp mọi dữ liệu thô gom được. Thực hiện UJ-1, UJ-3. Tính năng cào Shopee tự động **tạm hoãn**, Vinh nhập tay.

#### FR-3: Tạo và sửa Sản phẩm
Người vận hành có thể tạo và sửa Sản phẩm với tên, Link affiliate, giá tham khảo, ảnh, Danh mục và Dữ liệu thô (văn bản, ảnh, đánh giá dán vào).
- Ảnh nhập được bằng **tải lên từ thiết bị** hoặc dán URL ảnh. URL ảnh chỉ nhận từ các host được phép (Shopee và nơi lưu trữ của hệ thống).
- Link affiliate bắt buộc có và phải thuộc domain Shopee chính chủ (ví dụ `s.shopee.vn`, `shopee.vn`, `shope.ee`). Link khác bị từ chối kèm lý do.
- Giá hiển thị là "giá tham khảo", kèm ngày cập nhật giá.
- Sửa Sản phẩm **cập nhật ngay** mọi Bài web và Trang bio đang dùng nó (xem NFR-5 về độ trễ). Nội dung chữ đã viết trong thân bài không tự đổi.
- Danh mục của Sản phẩm được AI gợi ý (FR-11), Vinh đổi được.

#### FR-4: Dùng lại Sản phẩm
Người vận hành có thể gắn một hoặc nhiều Sản phẩm có sẵn vào một Bài web, và một Sản phẩm có thể nằm trong nhiều Bài web.
- Tìm Sản phẩm theo tên khi gắn vào bài.
- Thứ tự Sản phẩm trong bài chỉnh được.
- Xoá Bài web **không** xoá Sản phẩm. *[Thay đổi so với code hiện tại: Sản phẩm đang thuộc riêng một bài và bị xoá theo bài.]*

#### FR-5: Ẩn Sản phẩm
Người vận hành có thể ẩn một Sản phẩm bằng một thao tác, ví dụ khi hàng vi phạm hoặc ngừng bán. Giảm thiểu R-2.
- Sản phẩm bị ẩn biến mất khỏi mọi Bài web và Trang bio trong thời gian của NFR-5. Link affiliate của nó không còn xuất hiện trên website.
- CMS liệt kê các Bài web và Bộ nội dung đang dùng Sản phẩm đó, để Vinh tự xử lý bài trên Threads/Facebook.
- Bỏ ẩn để hiện lại được.

### 4.3 Trợ lý nghiên cứu AI

**Mô tả:** AI làm phần "đi tìm hiểu" thay Vinh, tạo ra một Hồ sơ nghiên cứu cho mỗi Sản phẩm, làm nền cho mọi nội dung. Với bài Gom link có nhiều Sản phẩm, mỗi Sản phẩm có Hồ sơ nghiên cứu riêng; Góc viết của bài được gợi ý từ tất cả các hồ sơ đó. Thực hiện UJ-1, UJ-2. Mọi kết quả là Gợi ý AI (xem §4.5).

#### FR-6: AI tìm thông tin sản phẩm trên web
AI tìm thông tin công khai về Sản phẩm (công dụng, cách dùng, nhận xét chung) và ghi lại **nguồn** của từng ý.
- Mỗi ý có link nguồn để Vinh kiểm tra.
- Không tìm được gì thì báo rõ, không bịa thông tin.

#### FR-7: AI đọc ảnh sản phẩm
AI dùng ảnh trong Dữ liệu thô để mô tả sản phẩm: hình dáng, màu sắc, chất liệu nhìn thấy, chữ trên bao bì.
- Với ảnh có chữ rõ trên bao bì, mô tả có trích được tên sản phẩm hoặc dòng chữ chính.
- Khi nhà cung cấp AI đang dùng không đọc được ảnh, hệ thống báo rõ và tiếp tục với dữ liệu chữ.

#### FR-8: Tóm tắt đánh giá
Từ các đánh giá Vinh dán vào, AI rút ra ba mục: điểm được khen, điểm bị chê, người dùng phù hợp.
- Mỗi ý phải dựa trên đánh giá đã dán. Không thêm ý không có trong đánh giá.
- Không có đánh giá nào thì bỏ qua bước này.

#### FR-9: Suy ra Người đọc mục tiêu
AI đề xuất 1–3 nhóm Người đọc mục tiêu cho Sản phẩm, mỗi nhóm kèm lý do. Vinh chọn một nhóm hoặc sửa lại.

#### FR-10: Gợi ý Góc viết
AI đề xuất ít nhất 3 Góc viết, mỗi góc có một câu mở đầu mẫu. Vinh chọn một góc để tạo Bộ nội dung.

#### FR-11: Gợi ý Danh mục và Loại bài
AI gợi ý Danh mục (từ các Danh mục có sẵn) cho Sản phẩm và Bài web, và Loại bài cho Bài web. Giá trị gợi ý được **tự điền**, Vinh đổi được.

### 4.4 Xưởng nội dung đa nền tảng

**Mô tả:** từ Hồ sơ nghiên cứu và Góc viết đã chọn, AI tạo Bộ nội dung cho ba nền tảng, mỗi nền tảng theo Hồ sơ phong cách riêng. Bài mạng xã hội **không phải** bản rút gọn của Bài web: chúng được viết cho thói quen đọc, giọng văn và nội quy của nền tảng đó. Vinh **tự đăng tay**, CMS chỉ tạo nội dung. Thực hiện UJ-1, UJ-3, UJ-4.

#### FR-12: Tạo Bộ nội dung trong một lần
Sau khi chọn Góc viết, người vận hành bấm một nút để AI tạo cả Bài web, Bài Threads, Bài Facebook và Bình luận kèm link. Kết quả hiện trong một màn hình. Thực hiện UJ-1.
- Vinh bỏ chọn được nền tảng không cần, ví dụ chỉ tạo Bài Threads.
- Khi một phần bị lỗi (ví dụ Bài Facebook), các phần đã tạo xong không bị mất. Phần lỗi tạo lại riêng được.
- Hệ thống ghi thời điểm tạo Sản phẩm, thời điểm tạo Bộ nội dung và thời điểm copy đầu tiên, để đo SM-3.

#### FR-13: Tạo Bài web
AI tạo Bài web gồm tiêu đề, tóm tắt, nội dung, thẻ, SEO title/description/keywords và ảnh đại diện, dựa trên Hồ sơ nghiên cứu, Người đọc mục tiêu và Góc viết.
- Nội dung chỉ dùng các định dạng website hỗ trợ và được làm sạch trước khi lưu. Thân bài không chứa link, ảnh hay giá; Sản phẩm hiển thị riêng bên dưới.
- Mặc định theo Hồ sơ phong cách Website (FR-18): 600–900 từ, 3–5 mục h2, tiêu đề ≤ 70 ký tự, SEO title ≤ 60 ký tự, SEO description 140–160 ký tự, tóm tắt ≤ 200 ký tự, 3–5 thẻ, 3–6 từ khoá.
- Ảnh đại diện chọn từ ảnh Sản phẩm hoặc tải lên. Để trống thì dùng ảnh của Sản phẩm đầu tiên.
- Chấm điểm SEO bằng AI (đã có) vẫn dùng được.

#### FR-14: Tạo Bài Threads riêng
AI tạo Bài Threads (một bài hoặc chuỗi) theo Hồ sơ phong cách Threads. Không cần có Bài web trước.
- Mỗi bài trong chuỗi ≤ 500 ký tự (giới hạn của Threads). Mặc định của hồ sơ: 4–7 bài, mỗi bài ≤ 250 ký tự, bài đầu là hook.
- Link affiliate **không** nằm trong thân bài mà nằm trong Bình luận kèm link. *[Thay đổi so với code hiện tại: bài cuối của chuỗi đang chứa link về website. Tab Threads hiện có được thay bằng FR-14 và FR-16.]*

#### FR-15: Tạo Bài Facebook riêng
AI tạo Bài Facebook theo Hồ sơ phong cách Facebook. Không cần có Bài web trước.
- Thân bài không chứa link. Link nằm trong Bình luận kèm link.
- Mặc định của hồ sơ: một bài, khoảng 80–250 từ, có xuống dòng dễ đọc trên điện thoại. *[ASSUMPTION]*

#### FR-16: Chuyển Bài web thành Bài mạng xã hội
Từ một Bài web có sẵn, người vận hành có thể tạo Bài Threads và/hoặc Bài Facebook. Kết quả vẫn tuân theo Hồ sơ phong cách của từng nền tảng và thuộc cùng Bộ nội dung với Bài web.

#### FR-17: Soạn Bình luận kèm link
Với mỗi Bài mạng xã hội, AI soạn Bình luận kèm link chứa Link affiliate của (các) Sản phẩm, dẫn **thẳng sang Shopee**.
- Link trong bình luận là nguyên Link affiliate, không qua link của website (FR-25).

#### FR-18: Quản lý Hồ sơ phong cách
Người vận hành có thể xem và sửa Hồ sơ phong cách của Website, Threads và Facebook: giọng văn, độ dài, emoji, điều cấm, nội quy.
- Hồ sơ được khởi tạo sẵn với giọng thương hiệu: gần gũi, dí dỏm vừa phải kiểu Gen-Z, rõ ràng, hữu ích, không sến, không phóng đại, không giật tít sai sự thật; tiếng Việt có dấu chuẩn.
- Giá trị khởi tạo của từng nền tảng như ở FR-13, FR-14, FR-15.
- Thay đổi áp dụng cho các lần tạo nội dung sau, không sửa nội dung đã tạo.
- Hồ sơ Threads và Facebook có ô "câu công khai" tuỳ chọn, mặc định để trống. Khi Vinh điền, AI chèn câu này vào Bình luận kèm link.

#### FR-19: Copy nhanh để đăng tay
Mỗi Bài mạng xã hội có nút copy cho từng bài trong chuỗi và cho Bình luận kèm link, dùng được bằng một chạm trên điện thoại.

#### FR-20: Đánh dấu đã đăng
Người vận hành có thể đánh dấu một Bài mạng xã hội là *đã đăng*, kèm link bài đăng tuỳ chọn.
- Hệ thống ghi thời điểm đánh dấu, để đo SM-2.
- Trên một Sản phẩm, Vinh thấy nó đã lên nền tảng nào.

#### FR-21: Tạo lại có định hướng
Với mọi Gợi ý AI, người vận hành có thể yêu cầu tạo lại kèm chỉ dẫn ngắn, ví dụ "ngắn hơn", "vui hơn", "bỏ phần giá".

### 4.5 Duyệt và an toàn nội dung

**Mô tả:** AI chỉ đề xuất. Không có nội dung nào của AI được xuất bản hoặc coi là sẵn sàng khi Vinh chưa Duyệt. Hệ thống chủ động cảnh báo những câu có thể gây rủi ro pháp lý hoặc vi phạm nội quy nền tảng.

#### FR-22: Duyệt Gợi ý AI
Mỗi phần AI tạo ra là một Gợi ý AI riêng, được Duyệt riêng: Hồ sơ nghiên cứu, Bài web, Bài Threads, Bài Facebook, Bình luận kèm link, Danh mục gợi ý. Người vận hành có thể sửa rồi Duyệt, hoặc từ chối.
- Gợi ý AI mới tạo ở trạng thái *chờ duyệt*.
- Sửa sau khi đã Duyệt không cần Duyệt lại.
- Từ chối thì Gợi ý AI bị bỏ. Vinh có thể tạo lại (FR-21).
- Nội dung Vinh tự viết, không qua AI, không cần Duyệt.
- Không xuất bản được Bài web khi phần AI của nó chưa được Duyệt.
- Bài mạng xã hội chưa Duyệt vẫn copy được, nhưng có cảnh báo rõ. *[ASSUMPTION: chọn "cảnh báo" để không chặn Vinh.]*

#### FR-23: Cảnh báo rủi ro
AI kiểm tra nội dung và gắn Cảnh báo rủi ro cho các câu: khẳng định công dụng y tế, mỹ phẩm hoặc thực phẩm; lời cam kết tuyệt đối ("100%", "chắc chắn"); so sánh hạ thấp đối thủ; giá cụ thể trong thân bài; và các điểm có thể vi phạm nội quy Threads/Facebook.
- Mỗi cảnh báo chỉ rõ câu bị cảnh báo và lý do.
- Cảnh báo không chặn việc Duyệt; Vinh là người quyết định.
- Có một bộ câu mẫu kiểm thử, gồm câu vi phạm và câu bình thường. AI phải cảnh báo đúng phần lớn câu vi phạm mà không cảnh báo tràn lan câu bình thường. *[ASSUMPTION: bộ ≥ 20 câu; bắt ≥ 90% câu vi phạm, báo nhầm ≤ 20% câu bình thường.]*

#### FR-24: Nhãn công khai affiliate trên website
Mọi Bài web có ít nhất một Sản phẩm tự động hiển thị Nhãn công khai affiliate ở vị trí dễ thấy. Trang bio cũng hiển thị nhãn này. (Bài web đã có, giữ nguyên hành vi.)

**Ghi chú:** theo quyết định của Vinh, Bài Threads và Bài Facebook **không** tự chèn nhãn. Xem R-1.

#### FR-25: Quy tắc link affiliate
Mọi Link affiliate trên website (thẻ Sản phẩm, Trang bio, Banner trỏ sang Shopee) hiển thị nguyên link Shopee chính chủ.
- Không đi qua đường dẫn chuyển hướng của website (ví dụ `/go/...`), vì có thể vi phạm điều khoản Shopee (R-7).
- Có `rel="sponsored nofollow"` và mở tab mới.

### 4.6 Bài web và công cụ CMS hiện có

**Mô tả:** các năng lực đang chạy phải được giữ khi Sản phẩm, Danh mục và lớp AI thay đổi.

#### FR-26: Trang bài viết
Trang Bài web hiển thị: mục lục tự sinh từ các mục h2, thời gian đọc, breadcrumb theo Danh mục, thẻ, khối Sản phẩm trong bài, Nhãn công khai affiliate, và ít nhất 3 **bài liên quan** cùng Danh mục (nếu có đủ). Thực hiện UJ-4.

#### FR-27: Quản lý Bài web trong CMS
Người vận hành có thể xem trước Bài web, xuất bản, chuyển về nháp và xoá bài (có xác nhận).
- Đổi slug Bài web đã xuất bản thì đường dẫn cũ chuyển hướng 301 sang đường dẫn mới.

### 4.7 Danh mục

**Mô tả:** Vinh tự tạo và quản lý Danh mục thay cho hai mục cố định hiện nay. Danh mục dùng chung cho Bài web và Sản phẩm. Thực hiện UJ-3, UJ-4.

#### FR-28: Quản lý Danh mục
Người vận hành có thể tạo, sửa (tên, đường dẫn, mô tả, thứ tự hiển thị) và xoá Danh mục.
- Không xoá được Danh mục còn Bài web hoặc Sản phẩm. Phải chuyển sang Danh mục khác trước.
- Đổi đường dẫn Danh mục thì đường dẫn cũ chuyển hướng 301.
- Đường dẫn Danh mục không được trùng đường dẫn hệ thống (ví dụ `cms`, `bai-viet`, `bio`, `tim-kiem`, `api`).
- Đường dẫn cũ `/meo-vat` và `/gom-link` vẫn hoạt động: hoặc là trang theo Loại bài, hoặc chuyển hướng 301. *[ASSUMPTION: giữ làm trang theo Loại bài.]*

#### FR-29: Trang Danh mục public
Mỗi Danh mục có trang liệt kê Bài web đã xuất bản, có phân trang, xuất hiện trong menu và sitemap, và dùng mô tả Danh mục làm meta description.

### 4.8 Trang bio

**Mô tả:** một trang public, gọn trên điện thoại, để Vinh gắn link vào hồ sơ Threads và Facebook. Người đọc thấy toàn bộ sản phẩm Vinh giới thiệu, chia theo Danh mục, và bấm sang Shopee. Thực hiện UJ-3.

#### FR-30: Trang bio public
Trang bio hiển thị phần giới thiệu ngắn, Nhãn công khai affiliate, liên kết quay về trang chủ website, và danh sách Sản phẩm đang *hiện*, nhóm theo Danh mục.
- Mỗi Sản phẩm có ảnh, tên, giá tham khảo và nút dẫn tới Link affiliate (theo FR-25).
- Người đọc lọc được theo Danh mục. Sản phẩm ghim nổi bật hiện lên đầu.
- Có đường dẫn ngắn, dễ gõ. *[ASSUMPTION: `/bio`.]*
- Nhãn công khai affiliate luôn hiển thị ở đầu trang, ghi rõ trang có quảng cáo, không bị ẩn (FR-24).
- Không có liên kết tuỳ chỉnh nào khác ngoài liên kết về trang chủ.

#### FR-31: Quản lý Trang bio
Người vận hành có thể sửa phần giới thiệu và câu chữ của Nhãn công khai affiliate (không tắt được), chọn Sản phẩm nào hiện trên Trang bio, ghim Sản phẩm nổi bật và sắp thứ tự.
- Sản phẩm mới tạo mặc định hiện trên Trang bio. *[ASSUMPTION]*
- Sản phẩm bị ẩn (FR-5) không bao giờ hiện trên Trang bio.

### 4.9 Banner

#### FR-32: Quản lý Banner
Người vận hành có thể tạo Banner (ảnh, tiêu đề, mô tả ngắn, link đích, thứ tự), bật/tắt, và đặt thời gian hiển thị tuỳ chọn (ví dụ trong dịp 11.11).
- Website chỉ hiện Banner đang bật và đang trong thời gian hiển thị.
- Banner không vỡ bố cục trên màn hình rộng 360px. CMS hiển thị tỉ lệ ảnh khuyến nghị.
- Link đích trỏ sang Shopee tuân theo FR-25.

### 4.10 Website và tương tác người đọc

#### FR-33: Đếm Lượt xem
Hệ thống ghi nhận Lượt xem của mỗi Bài web đã xuất bản.
- Không đếm lượt xem của Người vận hành khi đang đăng nhập CMS. *[ASSUMPTION]*
- Không đếm các bot phổ biến. *[ASSUMPTION]*
- Không lưu dữ liệu định danh người đọc.

#### FR-34: Bài xem nhiều
Trang chủ có khu "Xem nhiều", hiển thị các Bài web có nhiều Lượt xem nhất. *[ASSUMPTION: tính trong 30 ngày gần nhất.]* Các khối trang chủ hiện có (bài nổi bật, mới cập nhật, khối theo Loại bài) được giữ; chi tiết bố cục do bước UX quyết định.

#### FR-35: Thả tim
Người đọc có thể thả tim Bài web mà không cần đăng nhập, và bỏ tim được.
- Mỗi trình duyệt chỉ tính một tim cho mỗi bài.
- Giới hạn số lần thả tim từ cùng một nguồn trong một khoảng thời gian. *[ASSUMPTION: ≤ 30 lần/phút.]*

#### FR-36: Tìm kiếm
Người đọc có thể tìm Bài web đã xuất bản theo từ khoá. Kết quả khớp cả khi gõ **không dấu** (ví dụ "noi chien" tìm được "nồi chiên").

#### FR-37: Chia sẻ
Mỗi Bài web có nút chia sẻ lên Facebook, Threads và nút sao chép link. Trên điện thoại, có thể dùng chia sẻ gốc của hệ điều hành.

#### FR-38: Thống kê trong CMS
Danh sách bài trong CMS hiện Lượt xem và Lượt tim của từng Bài web, và sắp xếp được theo hai chỉ số này.

## 5. Yêu cầu phi chức năng

- **NFR-1. Nhà cung cấp AI thay được:** mọi tính năng AI gọi qua một lớp chung. Đổi nhà cung cấp hoặc model không cần sửa từng tính năng. **Không dùng OpenAI.** Lớp AI phải hỗ trợ đọc ảnh (FR-7) và tìm web (FR-6). Phương án cụ thể do kiến trúc chọn trong giới hạn NFR-9; xem `addendum.md` A1, A3.
- **NFR-2. Chịu lỗi AI:** khi một nhà cung cấp lỗi hoặc hết hạn mức, hệ thống tự chuyển sang nhà khác nếu có. Khi tất cả đều lỗi, Vinh nhận thông báo rõ ràng bằng tiếng Việt và dữ liệu đã nhập không bị mất.
- **NFR-3. Phản hồi khi AI chạy lâu:** giao diện hiện trạng thái đang xử lý và không bị treo. Mỗi thao tác AI hoàn tất hoặc báo lỗi trong tối đa 90 giây. Vinh rời màn hình rồi quay lại vẫn thấy kết quả. *[ASSUMPTION: mốc 90 giây.]*
- **NFR-4. CMS ưu tiên điện thoại:** toàn bộ UJ-1 và UJ-2 làm được trên điện thoại.
- **NFR-5. Hiệu năng và độ tươi website:** trang bài viết, trang chủ và Trang bio đạt Core Web Vitals mức "Tốt" trên di động. Lượt xem, Lượt tim và Banner không làm chậm việc hiển thị nội dung chính. Các thay đổi khi xuất bản, sửa, gỡ bài, hoặc sửa, ẩn Sản phẩm hiện trên website trong vòng khoảng 1 phút, không cần deploy lại.
- **NFR-6. Bảo mật CMS:** chỉ Người vận hành truy cập được CMS và các thao tác ghi. Mọi thao tác ghi đều kiểm tra quyền phía server.
- **NFR-7. Quyền riêng tư người đọc:** không thu thập dữ liệu cá nhân của người đọc. Lượt xem và Lượt tim chỉ dùng định danh ẩn danh tối thiểu để chống trùng.
- **NFR-8. SEO:** giữ và mở rộng nền SEO đang có: sitemap (gồm Danh mục), robots chặn CMS, JSON-LD `Article` và `BreadcrumbList` (theo Danh mục), canonical, OpenGraph kèm ảnh, title template, `lang="vi"`. Trang Danh mục có metadata riêng. Trang tìm kiếm không bị đánh chỉ mục. *[ASSUMPTION: noindex trang tìm kiếm.]* Link affiliate theo FR-25.
- **NFR-9. Chi phí vận hành:** ngân sách giai đoạn này là **0đ/tháng** cho AI và hạ tầng ngoài những gì Vinh đã có. Kiến trúc chỉ chọn giải pháp miễn phí, hoặc dùng gói thuê bao Vinh đang trả sẵn.
- **NFR-10. Triển khai:** chạy được trên một VPS đơn khi đến lúc deploy. Hiện chưa deploy. Trước khi deploy phải xoá trang `/styleguide`. 10 bài mẫu được **giữ lại** làm dữ liệu; link của chúng là link tìm kiếm Shopee, không tạo ra hoa hồng; Vinh thay bằng Link affiliate qua CMS khi cần.
- **NFR-11. Giao diện nhất quán:** website hỗ trợ chế độ sáng/tối theo hệ thống (đang có). Thành phần mới (Banner, tim, chia sẻ, Trang bio) theo design system hiện có và hiển thị đúng ở cả hai chế độ.

## 6. Ràng buộc và rủi ro

*Các nghĩa vụ pháp lý dưới đây lấy từ `research-landscape.md`; một số chi tiết (mức phạt, điều khoản) **chưa xác minh** với văn bản gốc.*

- **R-1. Pháp lý: nhãn quảng cáo trên Threads/Facebook.** Luật Quảng cáo sửa đổi (75/2025/QH15, hiệu lực 01/01/2026) yêu cầu người có ảnh hưởng ghi rõ nội dung là quảng cáo. Vinh chọn **không** tự chèn nhãn vào Bài Threads/Facebook và **chấp nhận rủi ro** này. **Giảm thiểu:** ô "câu công khai" tuỳ chọn (FR-18). Vinh tự theo dõi thay đổi quy định.
- **R-2. Pháp lý: Luật Thương mại điện tử (122/2025/QH15, hiệu lực 01/7/2026).** Người làm affiliate có thể phải xác thực danh tính và gỡ link khi sản phẩm vi phạm hoặc cơ quan yêu cầu. **Giảm thiểu:** Ẩn Sản phẩm (FR-5), có hiệu lực trong thời gian NFR-5.
- **R-3. Link affiliate qua Threads có thể mất mã theo dõi** do bản xem trước link (chưa xác minh). **Giảm thiểu:** trước khi đăng hàng loạt, Vinh kiểm tra click có được ghi nhận trong **báo cáo Click** của Shopee Affiliate. **Không tự mua** qua link của mình để test (R-7).
- **R-4. Facebook giới hạn bài có link** với Page chưa có Meta Verified. **Giảm thiểu:** đặt link ở bình luận (đã chọn), là cách né hợp lệ hiện nay.
- **R-5. Nhà cung cấp AI:** hạn mức miễn phí, model bị khai tử, và điều khoản dùng Claude CLI bằng gói cá nhân phía sau một web app (chưa xác minh). Xem `addendum.md` A3.
- **R-6. Nội dung AI bị coi là kém nguyên bản** trên Meta. **Giảm thiểu:** bước Duyệt và Hồ sơ phong cách giúp nội dung mang dấu ấn riêng của Vinh.
- **R-7. Điều khoản Shopee Affiliate.** Tự mua qua link của mình, che giấu hoặc chuyển hướng link qua domain riêng có thể bị coi là gian lận, dẫn tới mất hoa hồng hoặc khoá tài khoản (chưa xác minh với điều khoản gốc). **Giảm thiểu:** FR-3, FR-25; Vinh đọc lại điều khoản Shopee VN trước khi đăng đều.
- **R-8. Giá lỗi thời** có thể bị coi là thông tin quảng cáo sai. **Giảm thiểu:** giá là "giá tham khảo" có ngày cập nhật (FR-3); thân bài không chứa giá (FR-13); cảnh báo giá trong thân bài (FR-23).

**Việc vận hành ngoài sản phẩm (Vinh tự làm):** khai báo thu nhập; Shopee khấu trừ 10% thuế TNCN khi hoa hồng trong kỳ từ 2 triệu đồng; xác thực danh tính affiliate theo Luật TMĐT.

## 7. Không làm (rõ ràng)

- **Không tự đăng** lên Threads hay Facebook. Vinh đăng tay.
- **Không cào dữ liệu Shopee** (tạm hoãn). Không tự tạo hay chuyển đổi Link affiliate.
- **Không theo dõi doanh thu**, không gắn `sub_id`, **không đếm click** ra Shopee. Chỉ đếm Lượt xem Bài web. Vinh tự đối chiếu doanh thu trên dashboard Shopee Affiliate.
- **Không chuyển hướng link affiliate** qua domain của website (FR-25).
- **Không chèn link nội bộ vào thân bài.** Liên kết nội bộ đi qua bài liên quan, breadcrumb và Danh mục.
- **Không có tài khoản người đọc**, không đăng ký nhận tin (newsletter), không bình luận trên website (giai đoạn 2).
- **Không hỗ trợ nền tảng khác** ngoài Website, Threads, Facebook (không TikTok, Pinterest, Zalo). TikTok/Pinterest chỉ là nguồn Cảm hứng.
- **Không có nhiều người vận hành**, không phân quyền.
- **Không dùng OpenAI**, không dùng dịch vụ AI trả phí (NFR-9).

## 8. Phạm vi theo giai đoạn

Đã chốt với Vinh (2026-11-03): ưu tiên dòng nội dung tạo ra tiền trước (Threads/FB là nguồn traffic chính), website hoàn thiện sau.

### 8.1 Giai đoạn 1 — Ra bài, ra tiền
- Lớp AI mới thay OpenAI (NFR-1, NFR-2).
- Kho sản phẩm, gồm Ẩn Sản phẩm (FR-3 → FR-5).
- Trợ lý nghiên cứu AI (FR-6 → FR-11).
- Xưởng nội dung, gồm Đánh dấu đã đăng (FR-12 → FR-21).
- Duyệt, cảnh báo rủi ro, nhãn và quy tắc link (FR-22 → FR-25).
- Giữ trang bài viết và công cụ CMS (FR-26, FR-27).
- Danh mục tự quản lý (FR-28, FR-29), cần cho FR-11.
- Trang bio (FR-30, FR-31). *[ASSUMPTION: đưa vào giai đoạn 1 vì trực tiếp phục vụ người đọc từ Threads/FB.]*
- Đếm Lượt xem và thống kê trong CMS (FR-33, FR-38).

### 8.2 Giai đoạn 1.5 — Website uy tín
- Kho cảm hứng (FR-1, FR-2).
- Banner (FR-32).
- Bài xem nhiều, Thả tim, Tìm kiếm, Chia sẻ (FR-34 → FR-37).

### 8.3 Giai đoạn 2
- Bình luận trên website (có duyệt, AI lọc spam) — tạm hoãn.
- Xem lại: tự đăng qua Threads API, cào Shopee, theo dõi doanh thu bằng `sub_id`, đếm click, newsletter.

## 9. Chỉ số thành công

**Chính**
- **SM-1. Hoa hồng mỗi tháng**, tính **trước thuế**, theo dashboard Shopee Affiliate. Lưu ý cửa sổ ghi nhận đơn của Shopee (cookie) có giới hạn. Mục tiêu: **đặt sau 1 tháng chạy thật**. Đo hiệu quả của toàn bộ sản phẩm.

**Phụ**
- **SM-2. Nhịp đăng:** khoảng 2–3 Sản phẩm/ngày, mỗi Sản phẩm có Bài web, Bài Threads và Bài Facebook được đánh dấu đã đăng. Đo bằng FR-20. Xác nhận FR-12 → FR-20.
- **SM-3. Thời gian làm một Sản phẩm:** dưới 20 phút, từ lúc tạo Sản phẩm đến lần copy đầu tiên. Đo bằng các mốc thời gian ở FR-12. Xác nhận FR-6 → FR-21.
- **SM-4. Lượt xem Bài web** theo tuần, đo trong CMS. Kỳ vọng tăng chậm vì traffic website chủ yếu từ Google. Xác nhận FR-29, FR-33, FR-36.

**Chỉ số đối trọng (không tối ưu)**
- **SM-C1. Không bị gỡ bài hay khoá tài khoản** trên Threads/Facebook và Shopee Affiliate. Cân bằng SM-2: đăng nhiều mà bị khoá là mất kênh. Rủi ro về nhãn quảng cáo đã được Vinh chấp nhận (R-1) và không tính vào chỉ số này.
- **SM-C2. Tỉ lệ Duyệt mà không sửa:** không đẩy chỉ số này lên bằng cách duyệt vội. Bước Duyệt tồn tại để giữ chất lượng. Cân bằng SM-3.

## 10. Câu hỏi mở

1. **Lưu file:** ảnh và video tải lên lưu ở đâu, miễn phí theo NFR-9 (VPS, Supabase Storage free tier...)? Giữ bao lâu? → kiến trúc.
2. **Phương án AI trong ngân sách 0đ:** Claude CLI bằng gói thuê bao sẵn có (cần kiểm điều khoản), `llm.ts` miễn phí, hay kết hợp? Tìm web lấy từ nguồn miễn phí nào? → kiến trúc (`addendum.md` A3).
3. **Đọc nội dung video TikTok/Pinterest từ link** có khả thi không, hay chỉ dùng file Vinh tải về? → kiến trúc.
4. **Threads có giữ mã affiliate** khi link nằm trong bình luận không? → Vinh kiểm tra bằng báo cáo Click (R-3).
5. **Danh mục khởi tạo:** đề xuất 8 Danh mục suy từ 10 bài mẫu: Nhà bếp, Nhà cửa & Decor, Giặt giũ & Tủ đồ, Làm đẹp, Thời trang, Cây cảnh, Học tập & Làm việc, Du lịch. Vinh không phản đối; chỉnh lại trong CMS khi cần. Cách gán Danh mục cho 10 bài mẫu → epics.

## 11. Danh sách giả định

*Vinh đã xem và không phản đối các giả định dưới đây (2026-11-03). Chúng là mặc định cho các bước sau, chỉnh được khi có dữ liệu thật.*

- §2.3 UJ-3: chân dung người đọc do AI suy ra, sẽ viết lại khi có dữ liệu.
- FR-1: giới hạn khoảng 100 MB/file tải lên.
- FR-15: Bài Facebook mặc định 80–250 từ.
- FR-22: Bài mạng xã hội chưa Duyệt vẫn copy được nhưng có cảnh báo.
- FR-23: bộ kiểm thử ≥ 20 câu; bắt ≥ 90% câu vi phạm, báo nhầm ≤ 20%.
- FR-28: `/meo-vat`, `/gom-link` giữ làm trang theo Loại bài.
- FR-30: Trang bio ở `/bio`.
- FR-31: Sản phẩm mới mặc định hiện trên Trang bio.
- FR-33: không đếm lượt xem của Người vận hành và bot.
- FR-34: "Xem nhiều" tính trong 30 ngày.
- FR-35: giới hạn ≤ 30 lần thả tim/phút từ một nguồn.
- NFR-3: mốc 90 giây cho mỗi thao tác AI.
- NFR-8: noindex trang tìm kiếm.
- §8.1: Trang bio thuộc giai đoạn 1.
