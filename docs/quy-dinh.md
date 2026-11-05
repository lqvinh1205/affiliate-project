# Quy định dự án

> Nguồn: quyết định của Vinh (2026-11-03), PRD `_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md`, `research-landscape.md` cùng thư mục · Kiểm lần cuối: 2026-11-05 @ 8771851

Luật bất di bất dịch. Mọi agent, skill và workflow trong repo này phải tuân theo. Vi phạm một quy định là lỗi chặn (blocker), không phải góp ý.

## Tóm tắt cho agent

- Không commit, không push.
- Không đưa secrets vào code, log hay tài liệu.
- Nội dung AI chỉ là gợi ý; không gì do AI viết được xuất bản khi chưa Duyệt.
- Link affiliate luôn là link Shopee chính chủ, không chuyển hướng, có `rel="sponsored nofollow"`.
- Không thu thập dữ liệu cá nhân người đọc.
- Không dùng OpenAI; không dùng dịch vụ trả phí (ngân sách 0đ).
- Gặp điểm spec và code không khớp: hỏi, không tự chọn.

## 1. Mã nguồn và git

- **[QD-01]** Không bao giờ chạy `git commit`, `git push`, `git reset --hard`, `git rebase` hay bất kỳ lệnh viết lại lịch sử. Để thay đổi trong working tree cho Vinh tự review và commit.
- **[QD-02]** Không sửa code sinh tự động trong `generated/`; chạy `npx prisma generate`.
- **[QD-03]** Không sửa khối `<!-- BEGIN:nextjs-agent-rules -->` và khối `<!-- bmad:context -->` trong `AGENTS.md` bằng tay. Khối Next.js do `next dev` quản lý; khối BMad do skill `bmad-project-context` quản lý.
- **[QD-04]** Không thêm thư viện mới khi thư viện đang có làm được việc đó. Cần thêm thì nêu lý do và hỏi trước.

## 2. Secrets và môi trường

- **[QD-05]** Không bao giờ đọc ra, in, log hay chép giá trị trong `.env` vào code, tài liệu, commit, chat hay prompt gửi cho AI. `.env` bị gitignore; mẫu biến nằm ở `.env.example`.
- **[QD-06]** Thêm biến môi trường mới thì thêm vào `.env.example` với giá trị giả và một dòng chú thích.
- **[QD-07]** Không chạy `prisma migrate` hay lệnh ghi dữ liệu nào vào database không phải Postgres cục bộ (`docker compose`, cổng 54329). Database production chỉ Vinh thao tác (nơi chạy Postgres production chưa chốt; `.env.example` đang giả định Supabase — spine Deferred).

## 3. Nội dung và AI

- **[QD-08]** Mọi nội dung AI tạo là Gợi ý AI ở trạng thái *chờ duyệt*. Không xuất bản Bài web có phần AI chưa được Duyệt (PRD FR-22).
- **[QD-09]** Không dùng OpenAI. Mọi lời gọi AI đi qua một lớp chung (xem `docs/nen-tang-ky-thuat/lop-ai.md`); tính năng không gọi thẳng SDK của nhà cung cấp.
- **[QD-10]** Ngân sách AI và hạ tầng là 0đ/tháng. Không tích hợp dịch vụ trả phí; dịch vụ có free tier phải ghi rõ giới hạn.
- **[QD-11]** Prompt AI phải cấm bịa số liệu, giá, công dụng y khoa/mỹ phẩm tuyệt đối, và phải yêu cầu tiếng Việt có dấu chuẩn.
- **[QD-12]** HTML thân Bài web, bất kể nguồn (AI hay Vinh viết), luôn đi qua `sanitizePostHtml` (`platform/html/sanitize.ts`) khi ghi **và** khi render. Allowlist không có `a`, `img`; thân bài không chứa link, ảnh hay giá; Sản phẩm hiển thị riêng. Xem spine AD-22.

## 4. Affiliate và pháp lý

- **[QD-13]** Link affiliate phải thuộc domain Shopee chính chủ và hiển thị nguyên link. Không bọc qua đường dẫn chuyển hướng của website (ví dụ `/go/...`). Lý do: điều khoản Shopee có thể coi là che giấu link (PRD R-7, FR-25).
- **[QD-14]** Mọi link tới Shopee trên website (thẻ Sản phẩm, Trang bio, Banner) render qua `AffiliateLink` của `modules/products/components`: nguyên link, `target="_blank"`, `rel="sponsored nofollow noopener"`. Xem spine AD-11. `AffiliateLink` là đích, chưa có; trong lúc chờ, mẫu hiện có là `components/site/product-card.tsx` (code cũ).
- **[QD-15]** Mọi Bài web có Sản phẩm và Trang bio luôn hiển thị Nhãn công khai affiliate; không có tuỳ chọn tắt (PRD FR-24).
- **[QD-16]** Ẩn Sản phẩm phải có hiệu lực trên toàn website trong khoảng 1 phút (PRD FR-5, NFR-5) — cơ chế cache phải cho phép điều này.
- **[QD-17]** Không xây tính năng cào dữ liệu Shopee hay tự tạo link affiliate (tạm hoãn). Không xây tính năng tự đăng lên Threads/Facebook.

## 5. Người đọc

- **[QD-18]** Không thu thập dữ liệu cá nhân người đọc. Lượt xem và Lượt tim chỉ dùng định danh ẩn danh tối thiểu để chống trùng (PRD NFR-7). Không thêm công cụ theo dõi bên thứ ba khi chưa hỏi.
- **[QD-19]** Không có tài khoản người đọc, không bình luận trên website (giai đoạn 2).

## 6. Bảo mật CMS

- **[QD-20]** Mọi Server Action và Route Handler của CMS phải gọi `requireAdmin()` — Server Action thì qua `run()` (`platform/auth/run.ts`). `proxy.ts` không bảo vệ được Server Action bị POST trực tiếp. **Chỉ có ba ngoại lệ có tên** (spine AD-6), không thêm ngoại lệ khác:
  1. `modules/engagement/actions.ts` — ghi Lượt xem, Lượt tim từ người đọc và đọc số Lượt tim của một bài: không `requireAdmin`, bắt buộc validate, giới hạn tần suất, không `updateTag`, không lưu định danh người đọc (AD-23).
  2. `posts.searchPosts` trong `modules/posts/actions.ts` — action **chỉ đọc** công khai: validate, giới hạn tần suất, chỉ trả Bài web đã xuất bản.
  3. `app/cms/upload/route.ts` — Route Handler upload file: ngoại lệ chỉ với `run()` và với `proxy.ts` (nằm ngoài matcher), **vẫn** tự gọi `requireAdmin()` trước khi đọc body (AD-24).

  Cả ba là đích, chưa có trong code.
- **[QD-21]** Kiểm tra quyền và validate dữ liệu ở phía server, không tin dữ liệu từ client.

## 7. Làm việc với spec

- **[QD-22]** Nguồn sự thật theo thứ tự: PRD (`status: final`) → tài liệu kiến trúc (khi có) → code hiện tại → `docs/PRD_AFFILIATE_PROJECT.md` (chỉ là ý tưởng ban đầu, đã lỗi thời).
- **[QD-23]** Spec và code mâu thuẫn, hoặc spec thiếu: ghi thành câu hỏi. **BLOCKER** (không thể làm đúng nếu không có câu trả lời) thì dừng và hỏi; **MINOR** thì làm theo giả định hợp lý nhất, ghi rõ giả định trong báo cáo.
- **[QD-24]** Không tự mở rộng phạm vi ngoài yêu cầu. Thấy việc nên làm thêm thì đề xuất, không tự làm.

## Checklist khi review

- [ ] Không có commit/push do agent tạo.
- [ ] Không có secret trong diff.
- [ ] Server Action mới bọc `run()` (có `requireAdmin()`), trừ ba ngoại lệ của [QD-20].
- [ ] HTML bài đi qua `sanitizePostHtml` khi ghi và khi render.
- [ ] Link affiliate: domain Shopee, không redirect, có `rel="sponsored nofollow noopener"`, render qua `AffiliateLink` khi đã có.
- [ ] Nhãn công khai affiliate có mặt nơi có Sản phẩm.
- [ ] Không gọi OpenAI hay SDK AI trực tiếp; không thêm dịch vụ trả phí.
- [ ] Không thu thập dữ liệu cá nhân người đọc.
- [ ] Biến môi trường mới có trong `.env.example`.
