# Công thức: thêm trang public

> Ghép từ các tài liệu nền tảng và spine kiến trúc (AD-7, AD-11, AD-12, AD-26) · Kiểm lần cuối: 2026-11-05 @ 8771851

> Các bước chi tiết (kiểm UI, tái sử dụng, vị trí file, checklist review) ở `docs/cong-thuc/them-man-hinh.md`; công thức này là bản tóm tắt cho trang public.

Dùng khi thêm một trang trong `app/(site)/` (ví dụ Trang bio, trang Danh mục, trang tìm kiếm).

## Đọc trước

`[NX-01]`–`[NX-06]` (cache, `ensureStatic`), `[NX-21]` (cây route), `[GD-11]` (layout site), `[KT-05]`, `[KT-06]`.

## Các bước

1. **Chọn route và kiểu render.** Trang tĩnh: `[NX-30]`. Trang có tham số động: `[NX-31]` (cần `generateStaticParams`, bẫy `[NX-53]`). Nhớ `(site)` đặt `ensureStatic = "navigation"`: không truy vấn chưa cache, không `headers()`/`cookies()`/`searchParams` phía server (`[NX-03]`, `[NX-52]`). Slug không trùng route hệ thống (PRD FR-28).
2. **Dữ liệu.** Thêm hàm truy vấn có cache trong `modules/<miền>/queries.ts` theo `[NX-32]`: `"use cache"` + `cacheLife` + `cacheTag` của mọi module có bảng nó đọc (spine AD-7). Không thêm vào `lib/`; hàm cần dùng còn ở `lib/posts.ts` thì chuyển theo `docs/cong-thuc/chuyen-code-cu.md`. Dùng `select` gõ kiểu (`[PR-17]`, `[QU-08]`). Chỉ đọc dữ liệu đã xuất bản (`[KT-05]`).
3. **Giao diện.** Server Component mặc định; phần tương tác tách thành Client Component nhỏ `*.client.tsx` (`[GD-02]`, `[GD-18]`). Vị trí component theo spine AD-11 (`modules/<miền>/components/`, `app/(site)/_components/`, `components/shared/`), không ở `components/site/`. Ảnh qua `next/image` (`[GD-13]`, `[QU-22]`). Chuỗi tiếng Việt (`[QU-16]`).
4. **Link affiliate** (nếu có Sản phẩm): `[QD-13]`, `[QD-14]` (qua `AffiliateLink`), `[BM-14]`; hiện Nhãn công khai affiliate (`[QD-15]`, `[KT-10]`).
5. **SEO.** `generateMetadata`/metadata tĩnh, canonical, OG, JSON-LD nếu là bài (`[NX-38]`, `[NX-26]`); thêm vào sitemap; trang tìm kiếm thì `noindex` (PRD NFR-8).
6. **Ghi dữ liệu liên quan** (từ CMS) phải `updateTag` đúng tag (`[NX-06]`, `[KT-01]`).

## Kiểm chứng

`docs/kiem-chung.md` §1 + `npm run build` (bắt lỗi `ensureStatic`, `[NX-40]`). Xem ở 360px, sáng/tối (`[GD-40]`).
