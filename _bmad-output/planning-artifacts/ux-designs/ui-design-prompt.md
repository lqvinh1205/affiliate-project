# Prompt thiết kế UI/UX — website "Mẹo Vặt Cuộc Sống"

> Dán toàn bộ phần dưới đường kẻ vào công cụ AI thiết kế (v0, Google Stitch, Figma Make, Lovable, Claude…). Nếu công cụ giới hạn độ dài, dán phần **Bối cảnh + Hệ thống thiết kế** trước, rồi gửi từng trang ở mục **Các màn hình** trong các tin nhắn sau.

---

## Vai trò

Bạn là UI/UX designer chuyên blog đời sống và nội dung affiliate cho người dùng Việt Nam, đọc chủ yếu trên điện thoại. Hãy thiết kế giao diện website public cho blog **"Mẹo Vặt Cuộc Sống"** (tên miền `meovatcuocsong.vn`). Toàn bộ chữ trên giao diện bằng **tiếng Việt có dấu**, dùng nội dung mẫu thật (không dùng lorem ipsum).

## Bối cảnh sản phẩm

- Blog chia sẻ **mẹo vặt đời sống** (nhà bếp, dọn dẹp, giặt giũ, ở trọ…) và **bài gom link đồ xinh** — các bài tổng hợp sản phẩm Shopee hữu ích, kèm link affiliate.
- Người đọc đến từ **Threads / Facebook** (bấm link trên điện thoại) và từ **Google** (tìm một mẹo cụ thể, ví dụ "mẹo tẩy ố nồi chiên không dầu").
- Người đọc ẩn danh, không có tài khoản, không đăng nhập.
- Mục tiêu: người đọc thấy **hữu ích và đáng tin** — sản phẩm được giới thiệu tự nhiên, không giống trang quảng cáo; mua nhanh bằng một cú bấm sang Shopee.
- Website là nơi tạo uy tín: phải trông như một tạp chí đời sống chỉn chu, ấm áp, không rối mắt, không nhồi banner.

## Nguyên tắc UX bắt buộc

1. **Mobile-first**: thiết kế cho màn hình 360–390px trước, rồi tablet và desktop (container tối đa ~1152px). Không cuộn ngang trang (trừ các dải carousel có chủ đích).
2. **Đọc là chính**: cỡ chữ thân bài ≥ 17px trên mobile, dòng 1.7, độ dài dòng ~65–75 ký tự trên desktop.
3. **Minh bạch affiliate**: bài có sản phẩm và trang bio luôn hiển thị **nhãn công khai affiliate** ở vị trí dễ thấy, giọng thân thiện (ví dụ: "Bài viết có link tiếp thị liên kết. Bạn mua qua link, mình nhận một khoản hoa hồng nhỏ, giá bạn trả không đổi."). Không được ẩn hay làm mờ nhãn.
4. **Link sản phẩm** mở Shopee ở tab mới; nút mua rõ ràng nhưng không hung hăng (không nhấp nháy, không đếm ngược, không "SALE SỐC").
5. **Hiệu năng**: ưu tiên bố cục nhẹ, ảnh có tỉ lệ cố định (tránh nhảy layout), khu lượt xem/lượt tim/banner không được đẩy nội dung chính xuống khi tải.
6. **Truy cập**: tương phản đạt WCAG AA, vùng bấm ≥ 44px, có trạng thái focus rõ, tôn trọng `prefers-reduced-motion`.
7. Thiết kế đủ các trạng thái: đang tải (skeleton), rỗng, lỗi, không tìm thấy (404).

## Hệ thống thiết kế (giữ theo theme hiện có)

**Cảm giác:** ấm áp, mộc, gần gũi như góc bếp nhà mình — kiểu tạp chí đời sống, nhiều khoảng trắng, ảnh là nhân vật chính.

**Màu (light mode):**

| Token | Giá trị | Dùng cho |
|---|---|---|
| background | `oklch(0.985 0.012 75)` ≈ `#FCF8F2` kem ấm | nền trang |
| foreground | `oklch(0.27 0.012 50)` ≈ `#2F2925` nâu than | chữ chính |
| card | ≈ `#FFFFFF` | thẻ, khối nổi |
| primary | `oklch(0.57 0.165 35)` ≈ `#C4532F` đất nung | nút chính, link, điểm nhấn |
| muted-foreground | `oklch(0.5 0.015 50)` ≈ `#73685F` | chữ phụ, ngày đăng |
| border | `oklch(0.91 0.015 65)` ≈ `#E8DFD3` | đường kẻ |
| Mẹo vặt | `oklch(0.5 0.07 155)` ≈ `#4A7A5E` xanh lá xô thơm, nền nhạt `#E3F0E6` | nhãn danh mục Mẹo vặt |
| Gom link | `oklch(0.51 0.15 35)` ≈ `#B34A2A` đất nung đậm, nền nhạt `#F6E6DD` | nhãn danh mục Gom link |

Cần thêm một bản **dark mode** cùng tinh thần (nền nâu than ấm, không đen tuyền).

**Chữ:** font **Be Vietnam Pro** cho cả tiêu đề và thân bài (hỗ trợ dấu tiếng Việt tốt). Tiêu đề đậm vừa (600–700), không viết hoa toàn bộ.

**Hình khối:** bo góc nhỏ (~4–6px), đường kẻ mảnh thay cho bóng đổ nặng, ảnh tỉ lệ 4:3 cho thẻ bài, 16:9 cho ảnh đầu bài. Hiệu ứng hover nhẹ: ảnh phóng ~3%, tiêu đề gạch chân màu primary.

**Icon:** nét mảnh (kiểu Lucide).

## Các màn hình cần thiết kế

Với mỗi màn hình, vẽ bản **mobile (390px)** và **desktop (1440px)**.

### 1. Header & Footer (dùng chung)
- Header: logo chữ "Mẹo Vặt Cuộc Sống", menu danh mục (Mẹo vặt, Gom link, Nhà bếp, Dọn dẹp…, số lượng danh mục thay đổi được), nút tìm kiếm, nút "Đồ hay" dẫn tới trang bio. Mobile: menu dạng drawer. Header dính khi cuộn, gọn lại.
- Footer: giới thiệu ngắn, danh mục, link trang bio, câu công khai affiliate, bản quyền.

### 2. Trang chủ
Thứ tự gợi ý (được đề xuất bố cục tốt hơn nếu có lý do):
1. **Banner** chiến dịch (ví dụ "Săn đồ bếp dịp 11.11") — có thể nhiều banner dạng carousel, có thể không có banner nào; không vỡ trên màn 360px.
2. **Bài nổi bật**: ảnh lớn + nhãn danh mục + tiêu đề + tóm tắt + ngày đăng · số phút đọc.
3. **Mới cập nhật**: lưới thẻ bài (1 cột mobile, 2 tablet, 3 desktop).
4. **Xem nhiều**: danh sách xếp hạng 1–5 có số thứ tự lớn, thumbnail nhỏ.
5. **Gom link đồ xinh**: dải thẻ cuộn ngang (snap).
6. **Mẹo vặt hay**: danh sách dạng dòng (thumbnail trái, chữ phải).

### 3. Trang danh mục
Tiêu đề + mô tả danh mục, lưới bài, phân trang. Trạng thái rỗng khi danh mục chưa có bài.

### 4. Trang bài viết (quan trọng nhất)
- Breadcrumb (Trang chủ / Danh mục), nhãn danh mục, tiêu đề H1, tóm tắt, ngày đăng · phút đọc, ảnh đầu bài 16:9.
- **Nhãn công khai affiliate** ngay trên thân bài (khi bài có sản phẩm).
- **Mục lục** tự sinh từ các mục H2: desktop là cột phải dính khi cuộn; mobile là khối thu gọn được ở đầu bài.
- Thân bài: định dạng typography đẹp cho H2, H3, đoạn văn, danh sách, trích dẫn, ảnh có chú thích, ô "Mẹo nhỏ" nổi bật.
- **Khối "Sản phẩm trong bài"**: mỗi sản phẩm có ảnh vuông, tên (tối đa 2 dòng), giá tham khảo (ví dụ "Khoảng 89.000đ"), nút "Xem trên Shopee". Thiết kế cho cả 1 sản phẩm và 10 sản phẩm.
- **Thẻ (tags)** của bài.
- **Thả tim** (đếm số tim, bấm lại để bỏ tim, có hiệu ứng nhẹ) và **chia sẻ** (Facebook, Threads, sao chép link; mobile dùng chia sẻ gốc của hệ điều hành). Gợi ý vị trí: cuối bài và một thanh nổi gọn trên mobile.
- **Bài liên quan**: ít nhất 3 bài cùng danh mục.

### 5. Trang tìm kiếm
Ô tìm kiếm lớn, gợi ý từ khoá phổ biến, danh sách kết quả có highlight từ khớp, số kết quả, trạng thái "không tìm thấy" kèm gợi ý. Lưu ý: gõ không dấu ("noi chien") vẫn ra kết quả có dấu ("nồi chiên").

### 6. Trang bio (`/bio`) — gắn trên hồ sơ Threads/Facebook
- Chỉ dành cho mobile là chính, giống "link-in-bio" nhưng là **danh sách sản phẩm**.
- Đầu trang: avatar, tên, một dòng giới thiệu, **nhãn công khai affiliate luôn hiện**, link về trang chủ.
- Thanh lọc danh mục dạng chip cuộn ngang (Tất cả, Nhà bếp, Dọn dẹp, Phòng tắm…).
- Sản phẩm **ghim nổi bật** lên đầu, có dấu hiệu nhận biết.
- Lưới sản phẩm 2 cột trên mobile: ảnh, tên, giá tham khảo, nút "Mua trên Shopee".
- Không có link tuỳ chỉnh nào khác.

### 7. Trang 404
Thân thiện, có ô tìm kiếm và vài bài gợi ý.

## Nội dung mẫu để dùng

- Bài: "7 mẹo tẩy ố nồi chiên không dầu bằng đồ có sẵn trong bếp" (Mẹo vặt, 5 phút đọc)
- Bài: "Gom link 10 món đồ bếp mini cho người ở trọ nấu ăn một mình" (Gom link, 4 phút đọc)
- Bài: "Cách gấp quần áo gọn gàng bằng khay nhựa, tủ rộng gấp đôi" (Mẹo vặt)
- Bài: "Đồ dọn nhà đáng tiền dưới 100k" (Gom link)
- Sản phẩm: "Chảo chống dính mini 16cm" — khoảng 89.000đ; "Hộp đựng gia vị có nắp xoay" — khoảng 45.000đ; "Khăn lau bếp sợi tre (set 5)" — khoảng 39.000đ

## Đầu ra mong muốn

1. Bản thiết kế từng màn hình ở trên (mobile + desktop), light và dark mode cho ít nhất trang chủ và trang bài viết.
2. Bộ component dùng chung: header, footer, thẻ bài (dạng lưới, dạng dòng, dạng xếp hạng), nhãn danh mục, thẻ sản phẩm, nhãn công khai affiliate, nút tim, nút chia sẻ, mục lục, banner, chip lọc, phân trang, skeleton.
3. Ghi chú ngắn cho từng màn hình: vì sao bố cục như vậy, hành vi khi tương tác (hover, bấm, cuộn), và trạng thái rỗng/lỗi.
4. Nếu xuất code: dùng **React + Tailwind CSS 4**, component theo phong cách **shadcn/ui**, màu khai báo bằng CSS variables như bảng token ở trên.
