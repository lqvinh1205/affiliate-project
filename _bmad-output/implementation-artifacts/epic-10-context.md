# Epic 10 Context: Kho Cảm hứng (giai đoạn 1.5)

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Ban ngày Vinh lưu nhanh link video/mẹo (TikTok, Pinterest, Shopee) hoặc file video/ảnh kèm một dòng ghi chú ở `/cms/cam-hung`; tối mở Cảm hứng, bấm "Nghiên cứu" để AI gợi ý từ khoá tìm Sản phẩm trên Shopee và dàn ý bài mẹo, rồi gắn Sản phẩm (mới hoặc có sẵn) và tạo Bộ nội dung như UJ-1. Cần Epic 2 (Kho Sản phẩm, `UploadField`, backend lưu file — Story 2.8), Epic 4 (`platform/ai`, vòng đời `Suggestion` `RESEARCH`, Duyệt/Tạo lại) và Epic 5 (Bộ nội dung từ Chi tiết Sản phẩm).

## Stories

- Story 10.1: Lưu Cảm hứng nhanh
- Story 10.2: Từ Cảm hứng tới Bộ nội dung

## Requirements & Constraints

- **FR-1** Lưu Cảm hứng: link (TikTok/Pinterest/Shopee…) hoặc file video/ảnh, ghi chú tuỳ chọn; chỉ cần một nguồn; dưới 3 lần chạm sau khi dán.
- **FR-2** Từ Cảm hứng: AI gợi ý từ khoá Shopee + dàn ý (gợi ý `RESEARCH` gắn `inspirationId`, Duyệt/Tạo lại như Epic 4); gắn Sản phẩm; Bộ nội dung tạo từ đó ghi `ContentSet.inspirationId`, Cảm hứng thành *Đã dùng*.
- **UJ-2** Lưu ban ngày → tối nghiên cứu → gắn Sản phẩm → Bộ nội dung.
- Video ≤ 100 MB (AD-24). Không đọc được video → thông báo rõ, gợi ý tải file lên (AD-10: `skipped` có `video`, không thêm nhà AI mới).
- Không cào Shopee (policy), không thêm thư viện npm.

## Technical Decisions

- **Module `inspirations` (T1, AD-2):** chủ bảng `Inspiration` (AD-4), migration `add_inspiration` (AD-15) — cùng migration thêm `ContentSet.inspirationId`, `ResearchProfile.inspirationId`, FK `Suggestion.inspirationId` + partial unique index khoá đích.
- **Trạng thái:** lưu chỉ `NEW` / `SKIPPED`; *Đã dùng* suy ra từ `ContentSet.inspirationId` (spine: không lưu cột) và thắng trạng thái lưu.
- **Query chạm nhiều bảng (AD-2):** danh sách lọc và bộ theo Cảm hứng đọc `ContentSet` nên nằm ở `content-sets/cms-queries.ts` (T3).
- **AI (AD-10, AD-18, AD-19):** `suggestions/actions.ts` điều phối `researchInspiration` → `after()` gọi `ask()` với prompt `research/prompts/research-inspiration.prompt.ts`; Duyệt upsert `ResearchProfile` theo `inspirationId`. Test dùng AI giả (`fakeAi`).
- **Đường ghi (AD-6):** actions bọc `run()` → `safeParse` → `service` → `updateTag`.
- **Upload (AD-24):** file qua `UploadField` kind `media`; schema chỉ nhận đường dẫn `/uploads/<sha256>.<đuôi>` (`uploadedMediaKind`).
- **Tham số URL (AD-12):** `?trang-thai=` (lọc), `?trang=` (trang), `?cam-hung=<id>` (đi theo sang màn Sản phẩm), `?sp=` (ô tìm ProductPicker).

## UX & Interaction Patterns

- **UX-DR76 `/cms/cam-hung`:** nút "Lưu cảm hứng" (dính đáy trên mobile) mở Sheet đáy, ô link tự focus; chip lọc Mới / Đã dùng / Bỏ qua kèm số; mới nhất trước.
- **UX-DR77 `/cms/cam-hung/[id]`:** nguồn (link, file, ghi chú; sửa được), thẻ AI "Từ khoá Shopee và dàn ý", dải `skipped` video nói rõ hồ sơ dựa trên gì, link tới Bộ nội dung.
- **UX-DR61 InspirationActions:** "Gắn sản phẩm" (Tạo Sản phẩm mới / Chọn Sản phẩm có sẵn), "Bỏ qua" một chạm + Toast "Hoàn tác", "Đưa lại vào Mới".
- **UX-DR47:** dải "Từ Cảm hứng: …" ở màn Sản phẩm mở kèm `?cam-hung`.
- **UX-DR38 CmsShell:** thêm mục "Cảm hứng" sau "Sản phẩm".
- **UX-DR40 StatusBadge:** Mới `tertiary-fixed`, Đã dùng `secondary-container`, Bỏ qua trung tính.

## Cross-Story Dependencies

- 10.2 dùng bảng, `getInspirationForCms`, `InspirationStrip` của 10.1; chạm `suggestions/actions.ts` (`createContentSet`), `CreateContentSetPanel`, màn Sản phẩm (Epic 2, 4, 5).
