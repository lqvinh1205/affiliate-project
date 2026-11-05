---
title: 'Story 2.1: Bộ token thiết kế và khung CMS'
type: 'feature'
created: '2026-11-05'
status: 'done'
review_loop_iteration: 0
baseline_revision: '8a44768192d559b61bab4601f0ac70db96d4beb8'
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/DESIGN.md'
  - '{project-root}/docs/cong-thuc/them-man-cms.md'
  - '{project-root}/docs/cong-thuc/chuyen-code-cu.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Editor bài viết (components/cms/post-editor.tsx) sticky top-14 hở 56px ở ≥1024px, chưa dùng sticky-bar, còn hex #2b2522.
    evidence: |-
      CmsShell không có thanh trên ở desktop. Sửa khi chuyển editor sang modules/posts/components.
    location: >-
      components/cms/post-editor.tsx:114
    severity: medium
  - summary: >-
      Component cũ dùng alias meo-vat*/gom-link*/chart-3; token component UX-DR9 và stroke Lucide UX-DR10 chưa áp chung.
    evidence: |-
      Story 2.4, 2.6, Epic 3 chuyển các component này thì đổi sang tên token, bỏ alias, khai báo token component.
    location: >-
      app/globals.css
    severity: low
  - summary: >-
      app/cms/page.tsx chưa làm mỏng (AD-12), gọi platform/db trực tiếp.
    evidence: |-
      File trong LEGACY_APP_FILES; tách PostListScreen + modules/posts/cms-queries.ts ở story chuyển màn bài viết.
    location: >-
      app/cms/page.tsx
    severity: low
---

<intent-contract>

## Intent

**Problem:** Token thiết kế hiện là giá trị oklch mặc định của shadcn, không khớp `DESIGN.md`; dark mode bật bằng class qua `next-themes` có nút đổi tay (trái UX-DR2); CMS chỉ có header + thanh đáy 2 mục, không theo IA; `/cms/styleguide` thiếu rounded, spacing, elevation và giá trị dark.

**Approach:** Khai báo token từ frontmatter `DESIGN.md` một lần trong `app/globals.css` (biến CSS + `@theme inline`, ánh xạ shadcn theo UX-DR3), dark mode theo `prefers-color-scheme`; dựng `CmsShell` theo UX-DR38 thay header/thanh đáy CMS cũ; mở rộng `/cms/styleguide`; test tự động độ tương phản các cặp màu.

## Boundaries & Constraints

**Always:** Mỗi màu khai báo đúng một lần (giá trị light trong `:root`, giá trị `-dark` trong `@media (prefers-color-scheme: dark)`), chỉ token có cặp `-dark` thành biến (UX-DR1); 15 màu chỉ-light của DESIGN.md không thành biến; Be Vietnam Pro qua `next/font` đang có; heading 600; mobile Button/Input cao 44px trong CMS (UX-DR37); client component đặt tên `*.client.tsx`; `components/ui/*` chỉ thêm qua shadcn CLI, CLI kéo dependency npm mới thì không thêm (dùng `Sheet` có sẵn + `<nav>` thường) ([QD-04]); chạm file cũ thì chuyển theo `docs/cong-thuc/chuyen-code-cu.md`.

**Never:** Không nút đổi sáng/tối ở bất cứ đâu; không tạo route CMS mới ngoài vị trí hiện có; không sửa màu trong component cũ (`status-badge`, `category-badge`, `product-card`, `seo-score`) — chúng dùng alias; không đổi nội dung/logic màn bài viết; không commit ngoài quy trình.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tương phản chữ thường | mọi cặp chữ/nền trong bảng vai trò màu UX-DR4, cả light và dark | tỉ lệ ≥ 4.5:1 | test liệt kê cặp trượt |
| Tương phản ngoại lệ | chữ trên `primary-container` (≥12px/500), giá dark (headline-sm 600) | ≥ 4.5:1 | — |
| Màu chỉ cho viền/icon | `outline`, `outline-variant` | không dùng làm màu chữ; test không coi là cặp chữ | — |
| Hệ điều hành đổi sang tối | `prefers-color-scheme: dark` | toàn site và CMS dùng giá trị `-dark`, không cần reload hay nút | — |
| CMS ở 360px | mở `/cms` | thanh trên dính: tên mục hiện tại + nút menu; menu mở `Sheet` trái theo thứ tự IA | — |
| CMS ở ≥ 1024px | mở `/cms` | sidebar cố định, không nút menu | — |
| Mục chưa có màn | Sản phẩm, Cảm hứng, Danh mục, Banner, Trang bio, Hồ sơ phong cách | không hiện trong menu | — |
| Mục đang mở | `/cms`, `/cms/new`, `/cms/posts/[id]` | "Bài web" được đánh dấu (nền surface-container-high, chữ primary) | — |

</intent-contract>

## Code Map

- `_bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/DESIGN.md:18-153` -- nguồn token: colors (47 light; 31 có `-dark`; danh sách 15 chỉ-light ở comment frontmatter), typography (12 kiểu), rounded (6), spacing (12), components (15 token tổ hợp); elevation ở phần văn bản (level 0 `0 1px 8px rgba(47,41,37,.04)`, level 1 hai lớp, thanh dính 90% surface + blur 12px, dark bỏ bóng). Bảng vai trò màu và ngoại lệ tương phản: UX-DR4 (`_bmad-output/planning-artifacts/epics.md:285-303`).
- `_bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/EXPERIENCE.md:79-95` -- IA CMS: Bài web `/cms/bai-viet`, Sản phẩm, Cảm hứng, Danh mục, Banner, Trang bio, Hồ sơ phong cách, Styleguide `/cms/styleguide`.
- `app/globals.css` -- hiện: `@custom-variant dark (&:is(.dark *))`, `:root`/`.dark` oklch, `@theme inline` gồm shadcn + `meo-vat`, `meo-vat-soft`, `gom-link`, `gom-link-soft`, `chart-1..5`, `sidebar-*`; h1–h4 `font-bold`. Đổi: biến theo DESIGN.md; ánh xạ shadcn UX-DR3 (background→surface, foreground→on-surface, card/popover→surface-container-lowest, primary→primary, primary-foreground→on-primary, secondary→surface-container-low, muted→surface-container, muted-foreground→on-surface-variant, accent→surface-container-high, border/input→outline-variant, ring→primary, destructive→error); `meo-vat*`/`gom-link*` thành alias `var(...)` tới token badge Loại bài của DESIGN.md (secondary-container / tertiary-fixed và chữ tương ứng); `chart-*` bỏ nếu không còn chỗ dùng (grep); `sidebar-*` ánh xạ sang token surface/primary hoặc bỏ nếu không dùng; `@custom-variant dark` theo media; radius: một thang theo `rounded` của DESIGN.md (`--radius-sm` .125, `--radius` .25, `--radius-md` .375, `--radius-lg` .5, `--radius-xl` .75rem); spacing, elevation, touch-target thành token Tailwind.
- `app/layout.tsx` -- bỏ `ThemeProvider` (`next-themes`); giữ font. `components/ui/sonner.tsx` -- bỏ `useTheme`, `theme="system"`, style theo token `toast` (inverse-surface). `package.json` -- gỡ `next-themes` khi không còn import.
- `components/theme-toggle.tsx` -- xoá. Người dùng: `app/cms/styleguide/page.tsx` (bỏ dùng), `components/site/site-header.tsx` (bỏ dùng → chuyển file sang `app/(site)/_components/site-header.tsx` theo bảng chuyển; sửa import ở `app/(site)/layout.tsx`; file mới còn import code cũ thì thêm vào `LEGACY_APP_FILES` kèm comment, như `app/cms/styleguide/page.tsx`).
- `app/cms/layout.tsx` -- giữ metadata, `maxDuration = 120`; thay header + `CmsBottomNav` bằng `CmsShell`. `components/cms/bottom-nav.tsx` -- xoá (thay bằng `CmsShell`).
- `app/cms/_components/cms-shell.client.tsx` (mới) -- `usePathname` trong `<Suspense>`; danh sách mục theo IA, mỗi mục `{ label, href, match }`, chỉ khai báo mục đã có màn: "Bài web" → `/cms` (khớp `/cms`, `/cms/new`, `/cms/posts/*`; đổi sang `/cms/bai-viet` ở story chuyển màn bài viết), "Styleguide" → `/cms/styleguide`; thanh trên dính (tên mục, nút menu `Menu` Lucide mở `Sheet` trái) < 1024px; sidebar cố định ≥ 1024px; "Xem site" mở `/` tab mới.
- `app/cms/page.tsx` -- thêm nút "Tạo bài web" → `/cms/new` ở đầu danh sách (thay mục "Tạo mới" của thanh đáy cũ).
- `app/cms/styleguide/page.tsx` -- hiện màu (light và dark cạnh nhau, đọc từ cùng biến), typography 12 kiểu, rounded, spacing, elevation, component hiện có; component render theo chế độ hệ thống.

## Tasks & Acceptance

**Execution:**
- [x] `app/globals.css` -- token và ánh xạ như Code Map -- UX-DR1..10
- [x] `app/globals-contrast.test.ts` -- đọc `app/globals.css`, tính tương phản WCAG cho mọi cặp chữ/nền của UX-DR4 ở light và dark, tên test tiếng Việt -- UX-DR4
- [x] `app/layout.tsx`, `components/ui/sonner.tsx`, `components/theme-toggle.tsx` (xoá), `package.json` -- bỏ dark mode theo class -- UX-DR2
- [x] `components/site/site-header.tsx` → `app/(site)/_components/site-header.tsx`, `app/(site)/layout.tsx`, `eslint.config.mjs` -- chuyển file khi bỏ ThemeToggle -- AD-17
- [x] `app/cms/_components/cms-shell.client.tsx`, `app/cms/layout.tsx`, `components/cms/bottom-nav.tsx` (xoá), `app/cms/page.tsx` -- CmsShell -- UX-DR38, UX-DR94
- [x] `app/cms/styleguide/page.tsx` -- mọi token và component -- UX-DR82
- [x] `docs/nen-tang-ky-thuat/giao-dien.md` -- cập nhật mục token/dark mode/CmsShell theo code mới

**Acceptance Criteria:**
- Given `npm run build && npm start`, when mở `/`, một bài, `/cms`, `/cms/styleguide` ở 360px và 1280px, sáng và tối hệ thống, then đúng token, không còn nút đổi chế độ, CmsShell đúng Matrix.
- Given lưu bài lỗi validate trong CMS, when server trả `UserError`, then Toast hiện thông báo tiếng Việt.

## Spec Change Log

## Review Triage Log

### 2026-11-05 — Review pass
- verdicts: 44 findings — high 0, medium 5, low 27, false 12, maybe-false 0 (gộp nhóm theo nguyên nhân, mỗi lớp ghi riêng)
- findings:
  - Verification Gap
    - `[medium]` `[patch]` Mục đang mở của menu CMS 4.02:1, hover 4.42:1 ở dark, test thiếu cặp này — thêm cặp vào test, đổi màu active/hover
  - Blind Hunter
    - `[medium]` `[patch]` Tương phản menu — cùng nhóm trên
    - `[medium]` `[defer]` `post-editor.tsx` `sticky top-14` hở 56px ở ≥ 1024px — file cũ, sửa khi chuyển màn bài viết (ghi chú vào [GD-11])
    - `[low]` `[defer]` Thanh thao tác editor chưa dùng `sticky-bar` — cùng lúc chuyển editor
    - `[low]` `[patch]` Docs mâu thuẫn touch target 40/44px — sửa
    - `[low]` `[patch]` [QU-23] vẫn khuyên alias `meo-vat*` — sửa
    - `[low]` `[reject]` Styleguide đọc `globals.css` lúc chạy — trang prerender (build ra `○`)
    - `[low]` `[patch]` Bộ đọc token im lặng bỏ token sai định dạng — báo lỗi rõ + test
    - `[low]` `[patch]` Không kiểm khoá dark ⊆ light — thêm kiểm
    - `[low]` `[patch]` `app/design-tokens.ts` ở gốc `app/` — chuyển `platform/`
    - `[low]` `[reject]` `rounded-2xl..4xl` mặc định còn — chỉ `badge.tsx` của shadcn dùng; không ảnh hưởng thang token
    - `[low]` `[reject]` Toast lỗi và thành công cùng màu — token `toast` của DESIGN.md là inverse-surface; phân biệt bằng icon
    - `[low]` `[reject]` Luật 44px ép `min-width` cho icon nhỏ, chưa phủ Textarea/link — đúng UX-DR37 cho Button/Input; mở rộng khi có màn mới
    - `[low]` `[reject]` Nội dung CMS hẹp trên desktop — giữ để không đổi màn bài viết; xem lại khi có DataList (2.3)
    - `[low]` `[patch]` Trợ năng: `aside` thiếu tên, "Xem site" thiếu báo tab mới, "Close" tiếng Anh — sửa
    - `[low]` `[reject]` `app/cms/page.tsx` còn `text-2xl`, `bg-background` — file cũ, chuyển ở story bài viết
    - `[low]` `[patch]` [GD-10] site-header ghi "đã chuyển" dù còn phụ thuộc — ghi "chuyển một phần"
  - Edge Case Hunter
    - `[low]` `[reject]` Toast lỗi/thành công cùng màu — như trên
    - `[low]` `[patch]` Token 3/8 chữ số bị bỏ qua — cùng nhóm bộ đọc token
    - `[low]` `[patch]` Token chỉ có ở khối dark — cùng nhóm
    - `[low]` `[reject]` `readFileSync` lỗi nếu cwd khác — như trên
    - `[low]` `[reject]` Mất lối tắt "Tạo mới" ở màn khác — IA đặt nút tạo ở danh sách (DataList)
    - `[false]` `[reject]` Xoá bottom-nav làm mất lối tắt — đã thay bằng nút "Tạo bài web" ở `/cms`
    - `[low]` `[reject]` Nút icon nhỏ bị ép 44px — như trên
    - `[low]` `[patch]` Styleguide thiếu mẫu `shadow-sticky-bottom` — thêm
    - `[low]` `[patch]` [QU-16] số dòng `app/layout.tsx` sai — sửa
  - Intent Alignment
    - `[low]` `[defer]` Component cũ chưa dùng tên token, còn hex ở `post-editor.tsx:176` (UX-DR1 đọc chặt) — alias theo Design Notes; chuyển khi chạm từng component (2.4, 2.6, Epic 3)
    - `[low]` `[defer]` Token component UX-DR9 (site-header, chip, product-card…) chưa khai báo — story dựng component đó khai báo
    - `[low]` `[defer]` Lucide stroke 1.25–1.5 chưa có luật chung — áp khi chuyển component
    - `[false]` `[reject]` CMS đổi radius trái UX-DR37 — quyết định có lý do ở Design Notes (UX-DR1 một nguồn)
    - `[false]` `[reject]` Không kiểm vai trò `outline` không làm chữ — test bỏ `outline` khỏi cặp chữ theo UX-DR4
    - `[false]` `[reject]` Component trong styleguide chỉ một chế độ — không có nút đổi tay (UX-DR2); màu hiện cả hai chế độ
    - `[false]` `[reject]` Không dùng shadcn `Sidebar` — spec cho phép `<nav>` thường khi CLI kéo dependency mới
    - `[false]` `[reject]` Không test luồng UserError → Toast — đường này có sẵn, không đổi; Toaster vẫn gắn
    - `[false]` `[reject]` Không test 360px — đã kiểm tay trên Chrome headless (báo cáo triển khai)
    - `[false]` `[reject]` Thay đổi ngoài chữ story (nút tạo, chuyển site-header, heading 600) — theo Code Map và UX-DR5
  - Quy ước dự án
    - `[low]` `[patch]` `design-tokens.ts` sai chỗ — cùng nhóm
    - `[low]` `[patch]` [QU-26] thứ tự trong `design-tokens.ts`, `cms-shell`, import `app/cms/page.tsx` — sửa
    - `[low]` `[patch]` Styleguide dùng mới `components/cms/status-badge` — bỏ mẫu
    - `[low]` `[patch]` Styleguide `page.tsx` không mỏng (AD-12) — tách Screen
    - `[low]` `[defer]` `app/cms/page.tsx` chưa mỏng, gọi `platform/db` — story chuyển màn bài viết
    - `[low]` `[patch]` Docs còn `ThemeProvider`, bottom nav — sửa
    - `[low]` `[patch]` Số dòng `app/layout.tsx` trong docs — sửa

## Design Notes

- Một thang radius cho cả site và CMS: UX-DR1 (một nguồn) thắng ghi chú "CMS giữ radius shadcn"; giá trị shadcn mặc định gần trùng thang DESIGN.md.
- Alias `meo-vat*`/`gom-link*` giữ cho component cũ chạy đúng màu mới mà không chạm chúng; story chuyển các component đó (2.4, 2.6, Epic 3) đổi sang tên token và bỏ alias.

## Verification

**Commands:**
- `npm test` -- expected: xanh, gồm test tương phản
- `npx tsc --noEmit` -- expected: sạch
- `npm run lint` -- expected: sạch
- `npm run build` -- expected: sạch

**Manual checks (if no CLI):**
- `npm start` cổng trống: các trang ở Acceptance, giả lập `prefers-color-scheme: dark` (DevTools) và màn 360px.
</content>
</invoke>

## Auto Run Result

Status: done

**Thay đổi:**
- Token màu lấy từ DESIGN.md, khai báo một lần trong `app/globals.css`: 30 biến, mỗi biến có giá trị dark.
- Biến shadcn trỏ vào token mới theo UX-DR3. `secondary` của DESIGN.md đổi thành `--brand-secondary` để không trùng tên với shadcn.
- Kiểu chữ (12 kiểu), bo góc (một thang), khoảng cách, độ nổi và `touch-target` 44px đều thành token Tailwind.
- Dark mode theo `prefers-color-scheme`. Đã gỡ `next-themes` và nút đổi chế độ.
- `CmsShell` (`app/cms/_components/cms-shell.client.tsx`): < 1024px là thanh trên dính + Sheet trái; ≥ 1024px là sidebar. Menu chỉ có Bài web và Styleguide.
- Styleguide hiện mọi token, màu light và dark đặt cạnh nhau.
- Có test tương phản WCAG AA cho 23 cặp chữ/nền ở cả hai chế độ, và test cho bộ đọc token `platform/design-tokens.ts`.
- `site-header` chuyển sang `app/(site)/_components/`.

**Review:** 44 phát hiện (medium 5, low 27, false 12).
- Đã sửa:
  - tương phản của menu ở dark mode (4.02:1 lên ≥ 4.5:1, mục đang mở có thêm vạch bên trái);
  - bộ đọc token chuyển sang `platform/`, báo lỗi khi gặp token sai định dạng;
  - trang styleguide làm mỏng theo AD-12;
  - một số chỗ thiếu sót về trợ năng;
  - docs còn trỏ tới `ThemeProvider`, bottom nav, và ghi 40px thay vì 44px.
- Để lại 3 mục:
  - editor bài viết hở 56px ở desktop;
  - component cũ còn dùng alias màu, token component chưa khai báo;
  - `app/cms/page.tsx` chưa làm mỏng.

**Có cần review lần nữa không:** không (`false`). Chỉ 1 nhóm medium được sửa.

**Kiểm chứng:**
- `npm test`: 12 file, 93 test xanh.
- `tsc`, `lint`, `build` đều sạch; `/cms/styleguide` được prerender.
- Subagent đã mở trên Chrome headless (`next start`) ở 360px và 1280px, chế độ sáng và tối.

**Rủi ro còn lại:**
- Hàm `cn` coi `text-<token>` là màu chữ, nên `cn("text-label-md", "text-primary")` sẽ bỏ mất `text-label-md`. Đã ghi ở [GD-07]; story sau cần nhớ.
- Bỏ `richColors` nên toast lỗi chỉ khác toast thường ở icon.
- `toast.error` từ lúc lưu bài chưa được chạy thử đầu-cuối.
