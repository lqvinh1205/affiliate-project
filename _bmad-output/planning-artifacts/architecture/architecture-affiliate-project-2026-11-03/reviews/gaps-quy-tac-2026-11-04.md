# Gap quy tắc code — đầu vào cho lần cập nhật spine

> Nguồn: rà spine + `docs/` ngày 2026-11-04 (subagent), #1 và #3 đã kiểm lại tay · Dùng cho: `bmad-architecture` (Update) và `bmad-ux`

> **Trạng thái 2026-11-04:** gap #1–5, #9–20 và mục lệch tài liệu đã đóng trong spine (AD-9, 11, 12, 14, 17, 18, 20, 26, 27; xem memlog). Còn mở: #6–8 (phần hành vi) → `bmad-ux`.

Các công thức trong `docs/cong-thuc/` đánh dấu `[CHỜ SPINE: …]` tại chỗ phụ thuộc các gap dưới đây. Giải quyết xong một gap thì bỏ dấu tương ứng trong công thức.

## Chặn (spine)

1. **AD-12 mâu thuẫn Next.js 16.** `notFound()`/`permanentRedirect()` trong `<…Screen>` nằm trong `<Suspense>` → HTTP 200 thay vì 404 (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md:193`, `docs/nen-tang-ky-thuat/nextjs-16.md` [NX-63]). Đề xuất: trong `(site)`, `page.tsx` tra slug/lịch sử slug và gọi `notFound()`/`permanentRedirect()` trước `<Suspense>`; CMS chấp nhận 200.
2. **AD-18 thiếu cơ chế hỏi lại trạng thái `GENERATING`.** Client không import được `cms-queries` (AD-8); `actions.ts` là cửa ghi. Cần một cách duy nhất (ví dụ component client gọi `router.refresh()` theo chu kỳ, có giới hạn).
3. **`components.json` trỏ `@/lib/utils`, `@/lib`, `@/hooks`.** shadcn CLI sẽ tạo lại `lib/` (trái AD-1). Cần chỗ cho `cn` và hook dùng chung, và sửa alias trong epic nền.
4. **Thiếu bảng ánh xạ file cũ → vị trí mới** (`lib/*`, `components/site|cms/*`, `theme-toggle`, `json-ld`) và luật tách `app/cms/actions.ts` nhiều miền khi chỉ chạm một action.
5. **Danh sách CMS:** phân trang, lọc, tìm (CMS có dùng `searchParams` không), `PAGE_SIZE`; kích thước trang `/[danh-muc]/trang/[n]`.

15. **AI — prompt của module khác:** AD-2 cấm import `prompts/` của module khác, ngoại lệ AD-9 chỉ cho `service.ts` → `suggestions/actions.ts` lấy `PromptDef` bằng cách nào.
16. **AI — `sources`/`skipped` của `ask()`** chưa có trường lưu trong `Suggestion`.
17. **AI — `updateTag` trong `after()`** có hợp lệ không ([NX-55] chỉ cho trong Server Action); nếu không thì làm mới cache thế nào khi AI xong.
19. **301 cho cả một route bị gỡ:** AD-20 chỉ phủ đổi slug và cấm redirect qua `next.config`/`proxy.ts`.
20. **Vị trí còn trống trong bảng `docs/cong-thuc/chuyen-code-cu.md`:** `firstError`, `lib/content.ts`, module chủ của prompt viết bài/SEO/Threads, `category-badge`, `status-badge`, `post-editor`/`new-post-form`, `fields.tsx`, `seo-score`.

## Chặn (UX — `bmad-ux`)

6. **Điều hướng CMS:** ~8 màn chính, bottom nav chứa 4–5 mục, không sidebar; nav site có Danh mục không.
7. **Mẫu form RHF:** lỗi server vào trường hay toast, cảnh báo rời trang chưa lưu, xác nhận xoá (Dialog nào), sau khi tạo thì đi đâu.
8. **Trạng thái màn:** `error.tsx`/`loading.tsx` ở segment nào, vị trí skeleton, mẫu trạng thái rỗng.

## Nhỏ

9. `/styleguide`: giữ (chuyển vào `app/cms/styleguide`) hay xoá (`[NO-15]`).
10. Metadata theo loại trang: canonical trang phân trang, OG image, JSON-LD bio/danh mục, sitemap gồm gì.
11. Thêm component shadcn bằng CLI có cần hỏi trước không (AD-11 vs `[GD-16]`, `[QD-04]`).
12. Định dạng số đếm, "cập nhật x ngày trước" trên trang tĩnh (client) → `platform/format.ts`.
13. `error.tsx` là client nhưng không theo đuôi `*.client.tsx`; chuỗi UI inline hay `constants.ts`; tên Screen theo module hay route.
18. `[QD-20]` chỉ ghi 2 ngoại lệ, AD-6 ghi 3 (thêm `app/cms/upload/route.ts`) và nói QD-20 ghi cùng ba → sửa QD-20.
14. AD-17 bước 4 thiếu `AGENTS.md` (vẫn ghi OpenAI, `lib/posts.ts`, `app/cms/actions.ts`) → thêm "refresh qua `bmad-project-context`".

## Tài liệu lệch spine (sửa ở AD-17 bước 4)

- `[QD-14]` lấy mẫu `components/site/product-card.tsx`; `kiem-chung.md` ghi "không có test" (trái AD-16); `[PR-15]`/`[PR-16]` mô tả `lib/` và `app/cms/actions.ts`; `app/cms/layout.tsx` đang `maxDuration = 60` (AD-18 yêu cầu ≥ 90).
- Nơi chạy Postgres production: spine để Deferred, `docs/` ghi Supabase.

## Đưa vào epic nền

- Luật ESLint `no-restricted-imports` chặn import sai tầng (AD-2) và tạo lại `lib/`, `components/site|cms` (AD-1).
- Duyệt [QU-26]–[QU-28] trong `docs/quy-uoc-code.md` (đang là đề xuất), rồi viết lại `quy-uoc-code.md` theo spine (AD-17 bước 4).
