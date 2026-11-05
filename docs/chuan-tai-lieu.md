# Chuẩn viết tài liệu

Mọi file trong `docs/` theo chuẩn này. Người đọc chính là **agent AI** đang làm việc trong repo và các **workflow BMad** sẽ trỏ tới tài liệu; người đọc thứ hai là Vinh.

## 1. Nguyên tắc

- **Đúng với repo, không đúng với trí nhớ.** Mọi khẳng định về code phải kiểm được bằng một đường dẫn `file:dòng` hoặc một lệnh. Mọi khẳng định về thư viện phải dựa trên phiên bản đang cài (`package.json`, `package-lock.json`) và tài liệu đi kèm trong `node_modules/` — không dựa trên kiến thức chung, vì các phiên bản ở đây (Next.js 16, Prisma 7, Zod 4, Tailwind 4) khác nhiều so với bản cũ.
- **Ghi điểm khác mặc định, không chép sách giáo khoa.** Một mục chỉ có mặt khi agent không có nó sẽ làm sai hoặc phải tự đi tìm lâu.
- **Mệnh lệnh kèm lựa chọn đúng.** Viết "Không import `@prisma/client`; import từ `@/generated/prisma/client`", không viết "Có thể cân nhắc...".
- **Hiện tại, không lịch sử.** Mô tả cái đang đúng. Dự định tương lai ghi trong mục riêng, gắn nhãn **Dự kiến**.
- **Không ước lượng thời gian** (giờ, ngày) cho công việc.

## 2. Khuôn một tài liệu nền tảng kỹ thuật

```markdown
# <Công nghệ> <phiên bản>

> Phiên bản: <từ package.json> · Nguồn: <đường dẫn docs trong node_modules / URL> · Kiểm lần cuối: <YYYY-MM-DD> @ <commit>

## Tóm tắt cho agent
5–10 gạch đầu dòng: những điều PHẢI biết trước khi đụng vào phần này.

## Khái niệm cốt lõi
Giải thích ngắn, chỉ những khái niệm dự án dùng.

## Dự án dùng như thế nào
Từng điểm kèm `file:dòng`.

## Công thức
Các tình huống hay gặp, từng bước, có đoạn code mẫu lấy từ repo hoặc viết đúng API phiên bản hiện tại.

## Bẫy hay gặp
Mỗi bẫy: triệu chứng → nguyên nhân → cách đúng.

## Checklist khi viết workflow / review
Danh sách kiểm tra được dùng nguyên văn trong workflow.

## Tham khảo
Đường dẫn tài liệu gốc.
```

Tài liệu không phải nền tảng kỹ thuật (quy định, quy ước, công thức) bỏ các mục không hợp, nhưng giữ dòng phiên bản/nguồn và mục **Checklist** khi có thể.

## 3. Định dạng

- Markdown chuẩn CommonMark. Tiêu đề theo cấp, không nhảy cấp. Khối code luôn ghi ngôn ngữ (`ts`, `tsx`, `bash`, `prisma`).
- Sơ đồ dùng Mermaid, cú pháp phải hợp lệ.
- Tên file tiếng Việt không dấu, nối bằng gạch ngang. Nội dung tiếng Việt có dấu; thuật ngữ kỹ thuật giữ tiếng Anh khi đó là tên API.
- Dùng đúng thuật ngữ của PRD (`_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md` §3) khi nói về nghiệp vụ: Sản phẩm, Bài web, Danh mục, Loại bài, Gợi ý AI...
- Mỗi mục có ID ổn định khi workflow cần trỏ tới, dạng `[QD-01]` (quy định), `[QU-01]` (quy ước), `[NX-01]` (Next.js), `[PR-01]` (Prisma), `[GD-01]` (giao diện), `[BM-01]` (kiểm tra & bảo mật), `[AI-01]` (lớp AI). Không đánh số lại ID đã có; mục bị bỏ thì ghi "(đã bỏ)".

## 4. Bảo trì

- Sửa code làm một khẳng định sai → sửa tài liệu trong cùng thay đổi.
- Nâng phiên bản thư viện → kiểm lại tài liệu nền tảng tương ứng, cập nhật dòng phiên bản.
- Workflow trỏ tới tài liệu bằng ID mục, không chép nội dung sang.
