---
title: 'Sửa thẻ Sản phẩm lệch đáy, thu gọn link footer, /bio khớp Stitch'
type: 'bugfix'
created: '2026-11-09'
status: 'done'
baseline_commit: 'eeeed3cc041a26823b8f95d618fe8ced2557dc15'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** (1) Dải "Gom link đồ xinh" desktop: thẻ có tên 1 dòng ngắn hơn thẻ khác, nút "Xem trên Shopee" không sát đáy. (2) Footer: link cột Danh mục cách nhau 44px mỗi dòng, trông thưa. (3) `/bio` và màn đã lọc Danh mục còn lệch màn Stitch [Bio-M], [DM-M].

**Approach:** (1) thẻ *tile* giãn hết chiều cao ô lưới, nút `mt-auto`. (2) giảm khoảng cách dòng của link footer, giữ vùng bấm ≥ 24px theo WCAG 2.5.8 bằng chiều cao tối thiểu nhỏ hơn. (3) chỉnh `/bio` theo Stitch trong giới hạn loại trừ đã chốt (PRD, EXPERIENCE › Bố cục `/bio`), cập nhật DESIGN.md/EXPERIENCE.md theo quyết định mới.

## Boundaries & Constraints

**Always:** ProductCard vẫn là một AffiliateLink bọc cả thẻ (QD-14); giá luôn "Giá tham khảo … · cập nhật dd/mm/yyyy" (FR-3, R-8); AffiliateDisclosure giữ ở đầu `/bio` (FR-24/FR-30); dòng đang xem vẫn trên URL `?danh-muc=`; trang `/bio` vẫn tĩnh (AD-7); không đổi query/schema.

**Never:** tick verified, @handle, icon MXH, emoji Danh mục, ô tìm, chip lọc giá/danh mục con, bộ sưu tập ảo, huy hiệu ("Đã test", "Best Seller"), sao, giá gạch, mô tả ngắn Sản phẩm, "Bài mới nhất", newsletter, "Cập nhật hôm qua".

**Quyết định (Vinh 2026-11-09):**
- D1 ProductCard *row* kiểu Stitch **chỉ ở `/bio`** (biến thể mới `bio`): ảnh 96px, tên 2 dòng, dòng "Giá tham khảo · cập nhật dd/mm/yyyy", hàng dưới giá to bên trái + nút "Xem trên Shopee" bên phải. Trang bài viết giữ *row* hiện tại.
- D2 Màn đã lọc Danh mục: thêm khối đầu (nền `surface-container-low`, tên lớn, mô tả, "N món") và khối "Khám phá danh mục khác" (lưới 2 cột: tên, mô tả, "N món", mũi tên; link sang dòng đó) ở cuối.
- D3 Dòng Danh mục có ô vuông đầu dòng nền nhạt hiện chữ cái đầu tên Danh mục (`aria-hidden`).

</frozen-after-approval>

## Code Map

- `modules/bio/components/bio-highlights.tsx` -- `<li className="flex … lg:block">`: `lg:block` làm thẻ không giãn theo ô lưới. Sửa: giữ `flex`, thẻ `lg:w-full`.
- `modules/products/components/product-card.tsx` -- *tile* đã `flex-col` + `ShopeeButton mt-auto`; *row* dùng ở `/bio` và trang bài.
- `app/(site)/_components/site-footer.tsx` -- `FOOTER_LINK` có `min-h-touch-target` (44px) → mỗi link 44px.
- `modules/bio/components/bio-browser.client.tsx` -- `CategoryRows`, màn đã lọc (`row && list`), nhóm mặc định.
- `modules/bio/browse.ts` -- `bioCategoryRowsOf` (đếm món mỗi dòng) dùng lại cho "Khám phá danh mục khác".
- `app/(site)/bio/_components/bio-screen.tsx`, `bio-skeleton.tsx` -- khung trang; skeleton phải khớp kích thước mới.
- Ảnh Stitch: `_bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/imports/stitch/{trang-bio-danh-muc-dong-do-noi-bat-mobile,chi-tiet-danh-muc-do-bep-thong-minh-mobile}.{png,html}`.

## Tasks & Acceptance

**Execution:**
- [x] `modules/bio/components/bio-highlights.tsx` -- `li` giữ `flex` ở lg; `product-card.tsx` *tile* `lg:w-full` -- thẻ cao bằng nhau.
- [x] `app/(site)/_components/site-footer.tsx` -- link `min-h-8` + khoảng cách nhỏ -- gọn mà vùng bấm ≥ 32px.
- [x] `/bio` theo trả lời Q1–Q3; cập nhật DESIGN.md (ProductCard, BioCategoryRow) + EXPERIENCE.md (Bố cục `/bio`).
- [x] `bio-skeleton.tsx` -- khớp bố cục mới.

**Acceptance Criteria:**
- Given trang chủ ≥ 1024px có thẻ tên 1 dòng và 2 dòng, when xem dải "Gom link đồ xinh", then mọi thẻ cùng hàng cao bằng nhau và nút sát đáy thẻ.
- Given footer, when xem cột Danh mục, then dòng cách nhau ≈ 32px, mỗi link bấm được cả dòng.
- Given `/bio` 390px, when so ảnh chụp với Stitch, then bố cục khớp trừ các mục ở Never.

## Implementation Notes

- D1: biến thể `variant="bio"` trong `product-card.tsx`, dùng ở `bio-browser.client.tsx`; giá dùng `text-headline-sm` (token `product-card.price`). Thẻ *bio* padding ngang `space-sm` (không phải `space-md`) và khoảng giá–nút `space-xs`, để ở 390px giá và nút nằm cùng hàng; giá dài hơn ~8 ký tự hoặc màn 360px thì nút xuống dòng (`flex-wrap`).
- D2: khối đầu + `OtherCategories` (lưới 2 cột, dòng khác dòng đang xem, link qua `onNavigate`); thẻ khám phá không có ô chữ cái (D2 không nêu).
- D3: `InitialMark` (chữ cái đầu, `toLocaleUpperCase("vi")`, nền `primary-fixed`, `aria-hidden`).
- Footer: link `flex min-h-8` (32px, cả dòng), nhãn cột thêm `mb-space-xs`.
- Styleguide CMS thêm mẫu ProductCard *bio*.

## Spec Change Log

## Review Triage Log

| # | Nguồn | Phát hiện | Verdict | Bằng chứng / hướng |
|---|---|---|---|---|
| 1 | blind, edge, quy ước | Footer 32px trái luật 44px của DESIGN/EXPERIENCE, chưa ghi ngoại lệ | medium | Code đúng ý định (≥ 24px), doc chưa ghi → patch: ghi ngoại lệ SiteFooter vào DESIGN/EXPERIENCE |
| 2 | blind, edge, VG, quy ước | DESIGN.md ghi giá *bio* `headline-md`, code `headline-sm` | low | Hai nguồn lệch nhau → patch doc theo token `product-card.price` |
| 3 | blind | Trình đọc màn hình đọc "Giá tham khảo · cập nhật" trước số tiền | medium | Cả thẻ là một `<a>`, thứ tự DOM tách nhãn khỏi giá → patch: dòng nhãn `aria-hidden`, giá có tiền tố/hậu tố sr-only |
| 4 | VG | Lọc "danh mục khác" inline, không test | medium | Không test nào chạy biểu thức → patch: `bioOtherRowsOf` trong `browse.ts` + test |
| 5 | edge, blind | `InitialMark` mất dấu với tên NFD | low | Tên dán từ macOS có thể NFD; sửa trực tiếp `normalize("NFC")` → patch |
| 6 | edge | Tên rỗng / bắt đầu bằng ký hiệu | false | Tên Danh mục là `requiredText`; ký hiệu đầu tên không có trong dữ liệu thực tế |
| 7 | blind, edge | Tên dài trong lưới 2 cột không clamp | low | Xuống dòng, `li` flex nên thẻ cùng hàng vẫn cao bằng nhau; không tràn → reject |
| 8 | blind | Trùng logic ngày giữa `ReferencePrice` và *bio* | low | Vài dòng, cần thêm tham số để gộp → reject |
| 9 | blind | Token `product-card` chưa có thumb 96px | low | Prose DESIGN đã ghi; reject |
| 10 | blind | "Khám phá danh mục khác" không giới hạn | low | Tối đa 8 Danh mục + "Khác"; reject |
| 11 | blind | Skeleton thiếu pill/chevron, không phác màn đã lọc | low | Màn lọc chỉ phía client, fallback là màn mặc định; lệch nhỏ → reject |
| 12 | blind | Styleguide thiếu mẫu giá dài | low | reject |
| 13 | blind | DESIGN *tile* chưa ghi "cao bằng nhau, nút sát đáy" | low | reject |
| 14 | blind | EXPERIENCE ProductCard chưa nói về *bio* | low | Hành vi một `<a>` không đổi; reject |

## Verification

**Commands:**
- `npm test`, `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db`, `npx tsc --noEmit`, `npm run lint` -- đều qua.

**Manual checks:**
- Chụp headless Chrome `localhost:3001/`, `/bio`, `/bio?danh-muc=nha-bep` ở 390px và 1280px, so với ảnh Stitch.
