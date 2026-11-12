---
title: 'Sửa lỗi technical SEO + đổi tên thương hiệu thành "Mẹo Cuộc Sống"'
type: 'bugfix'
created: '2026-11-12'
status: 'done'
baseline_commit: '7087c9c46beb1c62e8c542d67a092b7a99d6ebc2'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/cong-thuc/sua-loi.md'
  - '{project-root}/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Crawl thật (dev server, 52 URL sitemap, 2026-11-12) cho thấy: bài viết mất `og:site_name`/`og:locale` (Next gộp `openGraph` nông — trang con thay hẳn root); `/gom-link` 0 bài vẫn index + có trong sitemap (trang mỏng); 8 Danh mục `description` null → không có meta description; trang chủ, `/bio`, Danh mục, Loại bài thiếu `og:url`; `/…/trang/n` trùng description với trang 1. Vinh đổi tên thương hiệu "Mẹo Vặt Cuộc Sống" → "Mẹo Cuộc Sống".

**Approach:** Một khối OpenGraph gốc dùng chung ở `platform/site.ts`, mọi trang tự đặt `openGraph` đều trải khối này và thêm `url` = canonical. Loại bài 0 bài xử lý như Danh mục rỗng (`noindex`, ngoài sitemap). Danh mục thiếu mô tả dùng mô tả mặc định sinh từ tên. Đổi `SITE_NAME` và mọi chỗ ghi cứng tên cũ.

## Boundaries & Constraints

**Always:** canonical/JSON-LD/sitemap theo bảng AD-26 (Loại bài rỗng = "trang mỏng" như Danh mục rỗng); giữ đuôi ` | <tên site>` ở title; tên site chỉ lấy từ `SITE_NAME`, không ghi cứng trong code hiển thị.

**Quyết định Q1 (Vinh 2026-11-12):** thương hiệu "Mẹo Cuộc Sống", tên miền `https://meocuocsong.io.vn/` (thay `meovatcuocsong.vn`). Sửa thẳng dòng thương hiệu + tên miền trong PRD, `AGENTS.md`, `docs/` trong thay đổi này, ghi ngày quyết định. Tên miền production đặt qua `NEXT_PUBLIC_SITE_URL` khi deploy (chưa deploy — spine Deferred); `.env.example` giữ `localhost`, thêm chú thích tên miền production.

**Never:** không thêm JSON-LD trang chủ (AD-26); không đổi tiêu đề/mô tả hiển thị trên trang Danh mục (mô tả mặc định chỉ dùng cho meta); không đổi `NEXT_PUBLIC_SITE_URL`/tên miền; không sửa tài liệu lịch sử trong `_bmad-output/` ngoài PRD (nếu Q1 chọn A).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bài viết | `/bai-viet/x` | có `og:site_name="Mẹo Cuộc Sống"`, `og:locale=vi_VN`, `og:type=article`, `og:url` | N/A |
| Trang danh sách | `/meo-vat`, `/nha-bep`, `/`, `/bio` | `og:url` = canonical tuyệt đối, vẫn có `og:image` mặc định | N/A |
| Loại bài rỗng | `/gom-link`, 0 bài xuất bản | `robots noindex`; không có trong sitemap | N/A |
| Danh mục không mô tả | `description = null` | meta description = mô tả mặc định theo tên | N/A |
| Trang phân trang | `/meo-vat/trang/2` | description = `<mô tả> – Trang 2` | mô tả null → vẫn dùng mặc định + hậu tố |

</frozen-after-approval>

## Code Map

- `platform/site.ts` -- `SITE_NAME`, `DEFAULT_OG_IMAGE`; thêm khối OpenGraph gốc dùng chung (docs Next "Merging": tách biến chung).
- `app/layout.tsx:21` -- `openGraph` root → dùng khối chung.
- `app/(site)/bai-viet/[slug]/page.tsx:22-33` -- `openGraph` thay hẳn root (nguyên nhân #1) → trải khối chung.
- `app/(site)/_components/list-page-metadata.ts` -- thêm `openGraph` (khối chung + `url: path`), hậu tố `– Trang n` cho description; xuất hàm mô tả Danh mục mặc định. Test: `list-page-metadata.test.ts`.
- `app/(site)/[danh-muc]/page.tsx`, `[danh-muc]/trang/[n]/page.tsx` -- truyền mô tả mặc định khi `description` null.
- `app/(site)/_components/post-type-route.ts` `postTypeMetadata` -- thành async, `noindex` khi `listPostsByType(t,1).total === 0`; `meo-vat/page.tsx`, `gom-link/page.tsx` đổi `export const metadata` → `generateMetadata`; trang `trang/[n]` thêm `await`.
- `app/sitemap.ts` -- Loại bài chỉ vào khi có bài (dùng `postType` sẵn trong `getPublishedSlugs()`).
- `app/(site)/page.tsx`, `app/(site)/bio/page.tsx` -- thêm `openGraph` (khối chung + `url`).
- Tên cũ ghi cứng: `site-header.tsx:25` (logo "Mẹo Vặt <span>Cuộc Sống</span>"), `site-footer.tsx:55`, `cms/styleguide/_components/styleguide-screen.tsx:119`, 7 prompt `modules/*/prompts/*.prompt.ts`, `scripts/risk-eval/run.ts:23`, `public/og-default.png` (ảnh có chữ tên cũ, tạo lại cùng bố cục bằng PIL, font DejaVu Sans Bold), `AGENTS.md:20` (ngoài khối được quản lý), `docs/README.md:1`, `docs/kien-truc-codebase.md:220`, `docs/nen-tang-ky-thuat/nextjs-16.md:253,289,565`, PRD `prd.md:2,8,9` (thương hiệu + tên miền), `.env.example:33` (chú thích tên miền production).

## Tasks & Acceptance

**Execution:**
- [x] `app/(site)/_components/list-page-metadata.test.ts` -- test đỏ trước: `openGraph.url`, `openGraph.siteName`, hậu tố description trang n, mô tả mặc định -- [sua-loi Bước 3]
- [x] `platform/site.ts` -- `SITE_NAME = "Mẹo Cuộc Sống"`; khối OpenGraph chung -- nguồn duy nhất
- [x] `app/layout.tsx`, `bai-viet/[slug]/page.tsx`, `page.tsx`, `bio/page.tsx` -- dùng khối chung, thêm `url` -- #1, #4
- [x] `list-page-metadata.ts` + 2 trang Danh mục -- og:url, hậu tố, mô tả mặc định -- #3a, #4, #7
- [x] `post-type-route.ts` + 4 trang Loại bài + `app/sitemap.ts` -- noindex/sitemap khi rỗng -- #2
- [x] Header, footer, styleguide, prompts, risk-eval, `og-default.png`, docs, PRD, `.env.example` -- đổi tên + tên miền

**Acceptance Criteria:**
- Given dev server + DB local, when crawl lại 52 URL sitemap, then mọi trang có `og:site_name="Mẹo Cuộc Sống"`, `og:locale`, `og:url` = canonical; không trang nào thiếu meta description; title có đuôi `| Mẹo Cuộc Sống`.
- Given 0 bài Gom link, when tải `/sitemap.xml`, then không có `/gom-link`; `/gom-link` có `noindex`.
- Given toàn repo, when `grep -rn "Mẹo Vặt Cuộc Sống"` trong code/docs (trừ `_bmad-output/` lịch sử), then không còn kết quả.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Nguồn | Phát hiện | Verdict | Bằng chứng / Xử lý |
|---|---|---|---|
| edge-case | `cms-shell.client.tsx:27` còn "CMS · Mẹo Vặt" | medium | Có thật (grep). patch → `SITE_NAME` |
| blind | Description trang n: "…bản thân. – Trang 2" | low | Crawl thấy đúng chuỗi này. patch: bỏ dấu chấm cuối trước hậu tố |
| conventions | Import `@/platform/site` sai nhóm ở 7 prompt + risk-eval [QU-26] | low | Có thật trong diff. patch |
| verification-gap, blind | `postTypeMetadata` noindex khi rỗng không có test | medium | Không test nào gọi `postTypeMetadata`. patch: thêm db test |
| verification-gap, blind | Lọc Loại bài trong sitemap không có test | medium | Không test nào gọi `sitemap()`. patch: thêm db test |
| blind | `kien-truc-codebase.md:221,226` lệch với thay đổi | low | Có thật. patch |
| verification-gap, blind | `generateMetadata` bài viết (giữ SITE_OPEN_GRAPH) không có test | medium | Có thật; cần test DB cho page metadata chưa có tiền lệ. defer |
| conventions, blind | AD-26 trong spine chưa ghi luật trang rỗng `noindex`/ngoài sitemap (Danh mục đã có từ trước) và og:url | medium | Có thật; sửa spine (final) cần Vinh/correct-course. defer |
| blind | DESIGN.md/EXPERIENCE.md/epics UX-DR11 còn tên logo cũ | low | Có thật; tài liệu UX nằm ngoài phạm vi sửa (Never). defer |
| edge-case, blind | `SiteLogoText` lỗi khi SITE_NAME một từ | false | `SITE_NAME` là hằng số hai từ trở lên; không đường nào tới. reject |
| edge-case | Bài không có seoDescription/excerpt thiếu meta description | low | Có từ trước, không do thay đổi; crawl 40 bài đều có. reject |
| verification-gap | Danh mục description "" bỏ qua fallback | false | `optionalText` lưu chuỗi rỗng thành null. reject |
| blind | `SITE_OPEN_GRAPH` nên `satisfies`/readonly | false | Dùng trong `Metadata` nên tsc đã kiểm kiểu; không nơi nào mutate. reject |
| blind | Thiếu twitter card | false | Crawl: `twitter:card=summary_large_image` có sẵn (Next tự sinh). reject |
| blind | Số dòng NX-26 trong `nextjs-16.md` lệch | low | Đã lệch từ trước (page.tsx ~45 dòng, trích :54-79). reject |
| blind | Mốc "Kiểm lần cuối" README cũ | low | Chỉ sửa tiêu đề, không ngụ ý kiểm lại. reject |
| blind | Ảnh OG chưa được xem | false | Đã mở xem: "Mẹo Cuộc Sống" đúng dấu, 1200×630. reject |

## Design Notes

Mô tả Danh mục mặc định (đề xuất, Vinh có thể sửa câu chữ khi duyệt): `` `Mẹo vặt và đồ hay chủ đề ${name}: bài hướng dẫn dễ làm, món đồ tiện ích được chọn lọc.` `` (~80–90 ký tự). Khối chung:

```ts
export const SITE_OPEN_GRAPH = { siteName: SITE_NAME, locale: "vi_VN", type: "website", images: [DEFAULT_OG_IMAGE] };
// bài: { ...SITE_OPEN_GRAPH, type: "article", url, images: [...] }
```

## Verification

**Commands:**
- `npm test` -- xanh, gồm test mới của `list-page-metadata`
- `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/affiliate_test npm run test:db` -- xanh
- `npx tsc --noEmit`, `npm run lint` -- sạch
- `npm run build` -- chạm metadata/route/sitemap (KC-06)

**Manual checks (if no CLI):**
- Chạy lại script crawl (scratchpad `audit.py`) trên dev server cổng 3100; so với bảng lỗi ban đầu.
- Xem `og-default.png` mới: chữ "Mẹo Cuộc Sống" đúng dấu, cùng bố cục cũ.
