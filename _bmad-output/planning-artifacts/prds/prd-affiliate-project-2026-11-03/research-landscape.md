# Research digest — bối cảnh affiliate Shopee × Threads/FB (2026-11-03)

Nguồn: subagent web research. [?] = chưa chắc, cần kiểm lại. Điều khoản Shopee VN gốc trả 503 khi tra — các quy tắc cấm chủ yếu từ blog.

## Shopee Affiliate
- Cookie 7 ngày (app) / có nguồn nói 30 ngày web; last-click [?].
- Sub_id gắn khi tạo link, lọc được trong báo cáo Click & Chuyển đổi (help.shopee.sg/10/article/126383).
- Open API GraphQL (`generateShortLink` với subIds, `conversionReport`) — chưa xác nhận cấp cho cá nhân VN [?].
- Đối soát ~20–22, thanh toán ~25–30 hằng tháng; khấu trừ 10% TNCN khi hoa hồng kỳ ≥ 2 triệu đồng.
- Mất hoa hồng khi: link không tạo từ hệ thống affiliate, đơn vi phạm, chưa khai báo thu nhập.
- Quy tắc cấm (tự mua, cloaking/redirect qua domain riêng) chưa xác minh văn bản gốc [?] → dùng link chính chủ `s.shopee.vn`; đọc lại điều khoản trước khi làm redirect `/go/xyz`.

## Threads / Facebook
- Threads API: 250 bài + 1.000 reply / 24h trượt; quyền `threads_content_publish`; đủ để đăng chuỗi.
- Link trên Threads không còn bị phạt rõ ràng (Mosseri 06/2025), nhưng link thiếu ngữ cảnh kém hiệu quả.
- Có thể link preview làm rơi tham số tracking [?] → cần test click→đơn thật.
- Facebook thử giới hạn Page/profile chuyên nghiệp chưa Meta Verified ~2 bài chứa link/tháng (12/2025, mở rộng 09/2026); link ở bình luận không giới hạn.
- Hệ quả: link ở comment/reply đầu, dẫn về trang gom link trên site.

## Công cụ tương tự
- Linktree, Beacons, Stan: thống kê click/CTR theo link, thiết bị, vị trí; UTM, pixel, bộ sưu tập sản phẩm.
- Gợi ý (suy luận) cho người vận hành một mình: kho sản phẩm dùng lại, click tracking + sub_id theo bài/kênh, A/B hook, lên lịch đăng Threads API, đối chiếu click↔đơn qua CSV Shopee.

## Pháp lý / chính sách
- Luật Quảng cáo sửa đổi 75/2025/QH15 (hiệu lực 01/01/2026): người có ảnh hưởng phải gắn nhãn quảng cáo rõ ràng; phạt ~60–80 triệu [?].
- Luật TMĐT 122/2025/QH15 (hiệu lực 01/7/2026): affiliate phải xác thực danh tính; gỡ link khi hàng vi phạm / cơ quan yêu cầu (Điều 26) [?].
- Hệ quả: nhãn công khai tự động; chặn claim công dụng/cam kết do AI viết (mỹ phẩm, thực phẩm); quy trình gỡ link nhanh.
- Meta: chữ do AI viết không bị cấm nhưng có rủi ro bị coi là không nguyên bản [?].

## Cần kiểm thủ công
Điều khoản Shopee VN về redirect/tự mua; ngưỡng thanh toán; Open API cho cá nhân VN; Threads có giữ tham số affiliate không (test link thật).
