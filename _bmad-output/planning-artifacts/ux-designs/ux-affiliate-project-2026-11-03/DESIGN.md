---
status: final
created: 2026-11-03
updated: 2026-11-04
sources:
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/.memlog.md
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/reconcile-stitch.md
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/imports/stitch/ds-warm-editorial-living.json
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/imports/stitch/ds-warm-editorial-living.md
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/imports/stitch/project-DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-affiliate-project-2026-11-03/imports/stitch/*.html
  - _bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md
  - _bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ui-design-prompt.md
name: Mẹo Vặt Cuộc Sống — Warm Editorial Living
description: Tạp chí đời sống ấm áp kèm gom link Shopee minh bạch. Site public theo design system Stitch "Warm Editorial Living"; CMS dùng shadcn (base-ui) mặc định với cùng token màu.
colors:
  # LIGHT — đúng nguyên giá trị theme.namedColors của Stitch "Warm Editorial Living" (không chỉnh).
  # CHỈ LIGHT, không dùng trong component, KHÔNG xuất thành CSS variable (giữ để đối chiếu Stitch):
  # primary-fixed-dim, on-primary-fixed-variant, inverse-primary, surface-tint, secondary-fixed, secondary-fixed-dim,
  # on-secondary-fixed, on-secondary-fixed-variant, on-tertiary, tertiary-container, on-tertiary-container,
  # tertiary-fixed-dim, on-tertiary-fixed-variant, surface-dim, surface-bright. Muốn dùng → thêm cặp -dark trước.
  primary: '#a33b19'
  on-primary: '#ffffff'
  primary-container: '#c4532f'
  on-primary-container: '#ffffff'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59f'
  on-primary-fixed: '#3a0a00'
  on-primary-fixed-variant: '#842503'
  inverse-primary: '#ffb59f'
  surface-tint: '#a43c1a'
  secondary: '#38684d'
  on-secondary: '#ffffff'
  secondary-container: '#baefcc'
  on-secondary-container: '#3e6e53'
  secondary-fixed: '#baefcc'
  secondary-fixed-dim: '#9fd2b1'
  on-secondary-fixed: '#002111'
  on-secondary-fixed-variant: '#1f5037'
  tertiary: '#a23d1e'
  on-tertiary: '#ffffff'
  tertiary-container: '#c25534'
  on-tertiary-container: '#ffffff'
  tertiary-fixed: '#ffdbd1'
  tertiary-fixed-dim: '#ffb59f'
  on-tertiary-fixed: '#3b0a00'
  on-tertiary-fixed-variant: '#822709'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  background: '#fff8f5'
  on-background: '#201b17'
  surface: '#fff8f5'
  surface-dim: '#e3d8d2'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdf1eb'
  surface-container: '#f7ece5'
  surface-container-high: '#f2e6df'
  surface-container-highest: '#ece0da'
  surface-variant: '#ece0da'
  on-surface: '#201b17'
  on-surface-variant: '#57423c'
  inverse-surface: '#352f2b'
  inverse-on-surface: '#faeee8'
  outline: '#8b716a'
  outline-variant: '#dec0b7'
  # DARK — Stitch chỉ có light. Giá trị có (S) lấy từ mục "Dark Mode (Night Reading)" trong project-DESIGN.md;
  # giá trị có (A) là [ASSUMPTION] suy ra cùng tinh thần (nâu than ấm, không đen tuyền).
  background-dark: '#1f1b18'                 # (S)
  on-background-dark: '#f2ebe3'              # (S)
  surface-dark: '#1f1b18'                    # (S)
  surface-container-lowest-dark: '#29231f'   # (S) card
  surface-container-low-dark: '#231e1a'      # (S)
  surface-container-dark: '#2b2521'          # (A)
  surface-container-high-dark: '#332c27'     # (A)
  surface-container-highest-dark: '#3b342f'  # (A)
  surface-variant-dark: '#3b342f'            # (A)
  on-surface-dark: '#f2ebe3'                 # (S)
  on-surface-variant-dark: '#a89f95'         # (S)
  outline-dark: '#8a8178'                    # (A)
  outline-variant-dark: '#3b342f'            # (S) border
  primary-dark: '#d96b47'                    # (S)
  on-primary-dark: '#1f1b18'                 # (A) 5.0:1
  primary-container-dark: '#b34a2a'          # (A) 5.34:1 với chữ trắng
  on-primary-container-dark: '#ffffff'       # (A)
  primary-fixed-dark: '#3d261e'              # (A) cùng nền badge Gom link
  on-primary-fixed-dark: '#e28165'           # (A)
  secondary-dark: '#82b896'                  # (A)
  on-secondary-dark: '#1f1b18'               # (A)
  secondary-container-dark: '#223328'        # (S) badge Mẹo vặt
  on-secondary-container-dark: '#82b896'     # (S)
  tertiary-dark: '#e28165'                   # (A)
  tertiary-fixed-dark: '#3d261e'             # (S) badge Gom link
  on-tertiary-fixed-dark: '#e28165'          # (S)
  error-dark: '#ffb4ab'                      # (A) Material dark mặc định
  on-error-dark: '#690005'                   # (A)
  error-container-dark: '#93000a'            # (A)
  on-error-container-dark: '#ffdad6'         # (A)
  inverse-surface-dark: '#f2ebe3'            # (A) toast
  inverse-on-surface-dark: '#352f2b'         # (A)
typography:
  headline-display: { fontFamily: Be Vietnam Pro, fontSize: 36px, fontWeight: '600', lineHeight: 46px, letterSpacing: -0.02em }
  headline-display-mobile: { fontFamily: Be Vietnam Pro, fontSize: 28px, fontWeight: '600', lineHeight: 36px, letterSpacing: -0.015em }
  headline-lg: { fontFamily: Be Vietnam Pro, fontSize: 26px, fontWeight: '600', lineHeight: 34px, letterSpacing: -0.01em }
  headline-lg-mobile: { fontFamily: Be Vietnam Pro, fontSize: 22px, fontWeight: '600', lineHeight: 30px, letterSpacing: -0.01em }
  headline-md: { fontFamily: Be Vietnam Pro, fontSize: 19px, fontWeight: '600', lineHeight: 26px, letterSpacing: -0.005em }
  headline-sm: { fontFamily: Be Vietnam Pro, fontSize: 16px, fontWeight: '600', lineHeight: 22px }
  body-lead: { fontFamily: Be Vietnam Pro, fontSize: 17px, fontWeight: '400', lineHeight: 28px }
  body-regular: { fontFamily: Be Vietnam Pro, fontSize: 15px, fontWeight: '400', lineHeight: 25px }
  body-sm: { fontFamily: Be Vietnam Pro, fontSize: 13px, fontWeight: '400', lineHeight: 20px }
  label-md: { fontFamily: Be Vietnam Pro, fontSize: 14px, fontWeight: '500', lineHeight: 18px }
  label-sm: { fontFamily: Be Vietnam Pro, fontSize: 12px, fontWeight: '500', lineHeight: 16px, letterSpacing: 0.02em }
  label-meta: { fontFamily: Be Vietnam Pro, fontSize: 11px, fontWeight: '600', lineHeight: 14px, letterSpacing: 0.04em }
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  container-max: 1120px          # Stitch DS (brief ghi ~1152px; theo Stitch)
  touch-target: 44px             # brief §Nguyên tắc 6
components:
  site-header: { background: '{colors.surface}', opacity: '90%', blur: 12px, height: 64px, foreground: '{colors.on-surface}' }
  bottom-tab-bar: { background: '{colors.surface}', opacity: '90%', blur: 12px, item-min: '{spacing.touch-target}', active: '{colors.primary}', inactive: '{colors.on-surface-variant}', label: '{typography.label-meta}' }
  post-card: { background: '{colors.surface-container-lowest}', radius: '{rounded.xl}', padding: '{spacing.space-md}', title: '{typography.headline-md}', excerpt: '{typography.body-regular}', meta: '{typography.label-meta}' }
  post-type-badge-meo-vat: { background: '{colors.secondary-container}', foreground: '{colors.on-secondary-container}', radius: '{rounded.DEFAULT}', type: '{typography.label-meta}' }
  post-type-badge-gom-link: { background: '{colors.tertiary-fixed}', foreground: '{colors.on-tertiary-fixed}', radius: '{rounded.DEFAULT}', type: '{typography.label-meta}' }
  product-card: { background: '{colors.surface-container-lowest}', radius: '{rounded.xl}', thumb: 80px, thumb-radius: '{rounded.lg}', title: '{typography.headline-sm}', price: '{typography.headline-sm}', price-color: '{colors.primary}' }
  affiliate-link-button: { background: '{colors.primary-container}', foreground: '{colors.on-primary-container}', radius: '{rounded.lg}', height: 36px, hit-area: '{spacing.touch-target}', type: '{typography.label-sm}' }
  affiliate-disclosure: { background: '{colors.surface-container-low}', foreground: '{colors.on-surface-variant}', icon-bg: '{colors.primary-fixed}', radius: '{rounded.xl}', padding: '{spacing.space-md}', type: '{typography.body-sm}' }
  button-primary: { background: '{colors.primary}', foreground: '{colors.on-primary}', radius: '{rounded.lg}', type: '{typography.label-md}' }
  chip: { background: '{colors.surface-container-high}', foreground: '{colors.on-surface-variant}', active-background: '{colors.primary}', active-foreground: '{colors.on-primary}', radius: '{rounded.full}', height: 36px, hit-area: '{spacing.touch-target}' }
  article-action-bar: { background: '{colors.surface}', opacity: '90%', blur: 12px, button-bg: '{colors.surface-container-low}', button-size: '{spacing.touch-target}', radius: '{rounded.full}' }
  toc: { background: '{colors.surface-container-high}', radius: '{rounded.xl}', padding: '{spacing.space-md}', title: '{typography.headline-sm}' }
  callout: { background: '{colors.primary-fixed}', foreground: '{colors.on-surface}', radius: '{rounded.xl}', padding: '{spacing.space-md}' }
  banner: { background: '{colors.surface-container-low}', radius: '{rounded.xl}', cta-background: '{colors.primary}', cta-radius: '{rounded.full}' }
  toast: { background: '{colors.inverse-surface}', foreground: '{colors.inverse-on-surface}', radius: '{rounded.lg}' }
---

# Mẹo Vặt Cuộc Sống — Design Spine

## Brand & Style

Mẹo Vặt Cuộc Sống là **tạp chí tổ ấm nhỏ**: mẹo vặt nhà bếp, dọn dẹp, ở trọ, và những bài gom link đồ xinh từ Shopee. Cảm giác cần đạt: lật một cuốn sổ tay gia đình được giữ gìn cẩn thận — mộc mạc, thân tình, nhiều khoảng thở. Gợi ý mua sắm phải đọc như lời khuyên của người quen, không như quảng cáo: không nhấp nháy, không đếm ngược, không "SALE SỐC" (brief §Nguyên tắc 4).

Phong cách theo Stitch: **Warm Editorial Minimalism** — tỉ lệ biên tập kiểu tạp chí, đất nung làm điểm nhấn, xanh xô thơm cho mẹo vặt, nền giấy kem ấm. Màn hình Stitch trong `imports/stitch/` là **chuẩn hình ảnh cho site public**; DESIGN.md này đã loại các phần lệch phạm vi PRD (xem Do's and Don'ts). Spine thắng khi mâu thuẫn với mockup.

Hai bề mặt, một bộ token:
- **Site public** — theo Stitch (7 màn trong `imports/stitch/*.html`, kèm ảnh chụp `.png` cùng tên để tham khảo).
- **CMS nội bộ** — shadcn (base-ui) mặc định; chỉ thay biến màu bằng token dưới đây. Không có mockup CMS.

## Colors

Giá trị light lấy **nguyên văn `theme.namedColors`** từ `imports/stitch/ds-warm-editorial-living.json` (design system Stitch "Warm Editorial Living"); file `.md` cùng tên chỉ dùng để hiểu ý đồ. Giá trị dark lấy từ `imports/stitch/project-DESIGN.md`.

**Cấu hình một chỗ.** Mọi màu khai báo đúng một lần dưới dạng token → CSS variables trong theme Tailwind; component chỉ dùng tên token, không dùng mã hex. Đổi một biến thì cả site public và CMS đổi theo. Bản dark là bộ giá trị thứ hai của cùng các biến, áp theo `prefers-color-scheme` (NFR-11). **Chỉ token có cặp `-dark` mới xuất thành CSS variable**; 15 token Stitch chỉ có bản light (liệt kê trong comment frontmatter) không được dùng và không có bản dark, để dark mode không thiếu biến.

Bảng dưới là ý nghĩa màu **trên site public**; cột "Không dùng cho" chỉ ràng buộc site public. CMS dùng ánh xạ trạng thái riêng ở bảng StatusBadge (Components › CMS).

| Vai trò | Token light | Token dark | Dùng cho | Không dùng cho |
|---|---|---|---|---|
| Nền trang | `{colors.surface}` | `{colors.surface-dark}` | canvas mọi trang | — |
| Thẻ / khối nổi | `{colors.surface-container-lowest}` | `{colors.surface-container-lowest-dark}` | PostCard, ProductCard, Dialog | nền trang |
| Khối trầm | `{colors.surface-container-low}` / `-high` | `-dark` tương ứng | AffiliateDisclosure, Banner, TOC, nút tròn trên ArticleActionBar, footer | chữ |
| Chữ chính | `{colors.on-surface}` | `{colors.on-surface-dark}` | tiêu đề, thân bài | — |
| Chữ phụ | `{colors.on-surface-variant}` | `{colors.on-surface-variant-dark}` | meta, mô tả, tab chưa chọn | nút |
| Điểm nhấn đất nung | `{colors.primary}` | `{colors.primary-dark}` | link, giá tham khảo, tab đang chọn, nút chính, tim đã thả | nền khối lớn, trang trí |
| CTA Shopee | `{colors.primary-container}` | `{colors.primary-container-dark}` | AffiliateLink | nút không dẫn sang Shopee |
| Mẹo vặt (xô thơm) | `{colors.secondary-container}` + `{colors.on-secondary-container}` | `-dark` | PostTypeBadge "Mẹo vặt" | trạng thái thành công |
| Gom link (đất nung nhạt) | `{colors.tertiary-fixed}` + `{colors.on-tertiary-fixed}` | `-dark` | PostTypeBadge "Gom link" | cảnh báo |
| Nhấn nhẹ | `{colors.primary-fixed}` + `{colors.on-primary-fixed}` | `-dark` | nút "Đồ hay", nền icon tròn, Callout, dấu Ghim | chữ dài |
| Đường kẻ | `{colors.outline-variant}` | `{colors.outline-variant-dark}` | hairline 1px, viền input; ngoại lệ duy nhất: số trang trí PostCard *rank* (xem Components) | chữ mang nghĩa (1.7:1) |
| Lỗi | `{colors.error}` / `{colors.error-container}` | `-dark` | lỗi form, destructive | Cảnh báo rủi ro (dùng tertiary) |

**Ánh xạ sang biến shadcn** (dùng cho CMS và component nền): `background`→surface · `foreground`→on-surface · `card`/`popover`→surface-container-lowest · `primary`→primary · `primary-foreground`→on-primary · `secondary`→surface-container-low · `muted`→surface-container · `muted-foreground`→on-surface-variant · `accent`→surface-container-high · `border`/`input`→outline-variant · `ring`→primary · `destructive`→error. Mỗi biến có cặp `-dark`.

**Tương phản đã kiểm (WCAG 2.x).** Ba ràng buộc rút ra:
- Chữ trên `{colors.primary-container}` (nút Shopee) vừa đạt AA chữ nhỏ — giữ chữ ≥ 12px, đậm 500.
- Giá trên thẻ ở dark sát ngưỡng — giá giữ `{typography.headline-sm}` 600, không thu nhỏ.
- `{colors.outline}` chỉ đạt 4.3:1 — chỉ dùng cho icon/viền, không dùng cho chữ.

| Cặp màu (chữ / nền) | Light | Dark | Ràng buộc |
|---|---|---|---|
| on-surface / surface | 16.3:1 | 14.5:1 | — |
| on-surface-variant / surface | 8.9:1 | 6.6:1 | — |
| on-primary / primary | 6.6:1 | — | — |
| primary / surface | 6.3:1 | 5.0:1 (`{colors.primary-dark}` / `{colors.surface-dark}`) | — |
| on-primary-container / primary-container | 4.54:1 | 5.3:1 (chữ trắng / `{colors.primary-container-dark}`) | chữ ≥ 12px, đậm 500 |
| Giá `{colors.primary-dark}` / thẻ `{colors.surface-container-lowest-dark}` | — | 4.54:1 | giá giữ `{typography.headline-sm}` 600 |
| on-secondary-container / secondary-container (badge Mẹo vặt) | 4.6:1 | 5.88:1 | — |
| Badge Gom link | 13.3:1 | 5.06:1 | — |
| StatusBadge trung tính `{colors.on-surface-variant}` / `{colors.surface-container-high}` | 7.6:1 | 5.3:1 | — |
| Lỗi `{colors.on-error-container}` / `{colors.error-container}` | 7.2:1 | — | — |
| **Không phải chữ (≥ 3:1):** vòng focus `{colors.primary}` / surface | 6.3:1 | 5.0:1 (`{colors.primary-dark}` / surface-dark) | — |
| `{colors.outline}` | 4.3:1 | — | chỉ icon/viền, không chữ |

## Typography

Một họ chữ duy nhất: **Be Vietnam Pro** (dấu tiếng Việt chuẩn), theo Stitch. Tiêu đề 600, letter-spacing âm nhẹ; nhãn nhỏ letter-spacing dương. Không viết hoa toàn bộ, trừ `{typography.label-meta}` trong badge.

Desktop giống mobile, trừ khi cột Desktop ghi khác.

| Vai trò | Mobile | Desktop (nếu khác) |
|---|---|---|
| H1 bài viết / tiêu đề trang | `{typography.headline-lg-mobile}` | `{typography.headline-display}` |
| Tiêu đề Bài nổi bật | `{typography.headline-display-mobile}` | `{typography.headline-display}` |
| Tiêu đề khu (Xem nhiều, Mới cập nhật) | `{typography.headline-md}` | `{typography.headline-lg}` |
| H2 thân bài | `{typography.headline-md}` | `{typography.headline-lg}` |
| Tiêu đề thẻ | `{typography.headline-md}` (lớn) / `{typography.headline-sm}` (nhỏ) | |
| Thân bài | `{typography.body-lead}` (17/28, đáp ứng brief ≥ 17px, ~1.65) | khung chữ 65–75 ký tự |
| Mô tả thẻ, đoạn UI | `{typography.body-regular}` | |
| Ghi chú, nhãn công khai | `{typography.body-sm}` | |
| Nút, link | `{typography.label-md}` / `{typography.label-sm}` | |
| Meta (ngày · phút đọc), badge, nhãn tab | `{typography.label-meta}` | |

CMS dùng thang chữ mặc định của shadcn nhưng đổi `fontFamily` sang Be Vietnam Pro. [ASSUMPTION: dùng chung font cho CMS để xem trước khớp trang public.]

## Layout & Spacing

Mobile-first, chuẩn 390px, kiểm ở 360px. Theo Stitch DS:
- **Mobile (< 768px):** một cột, lề `{spacing.margin}`, khoảng giữa khối `{spacing.gutter}`.
- **Tablet (768–1023px):** lưới 6 cột, lề `{spacing.margin-tablet}`, gutter `{spacing.gutter-desktop}`.
- **Desktop (≥ 1024px):** lưới 12 cột, lề `{spacing.margin-desktop}`, gutter `{spacing.gutter-desktop}`, khung tối đa `{spacing.container-max}` căn giữa. Trang bài: 8 cột thân bài + 4 cột bên phải, dính (TOC, tim/chia sẻ).
- Giữa các khu: `{spacing.space-xl}`; giữa khối trong khu: `{spacing.space-lg}`; padding trong thẻ: `{spacing.space-md}` (mobile) / `{spacing.space-lg}` (desktop).
- Vùng bấm tối thiểu `{spacing.touch-target}`. Phần tử có hình nhỏ hơn (chip, nút Shopee 36px) giữ hình nhưng nới **vùng bấm** tới `{spacing.touch-target}` bằng pseudo-element `::before` trong suốt (`inset` âm 4px trên/dưới); khoảng cách giữa hai phần tử như vậy ≥ `{spacing.space-sm}` để vùng bấm không chồng nhau.
- Header cố định (cao theo `{components.site-header}`) và BottomTabBar cố định: nội dung có padding trên/dưới tương ứng, cộng `safe-area-inset`.
- Ảnh có tỉ lệ cố định để không nhảy layout (NFR-5): ảnh đầu bài 16:9, ảnh PostCard 16:9 (Stitch), ảnh ProductCard 1:1. [ASSUMPTION: brief ghi thẻ bài 4:3; theo Stitch 16:9.]

## Elevation & Depth

Phẳng như giấy; chiều sâu bằng lớp tông nền và hairline, không bằng bóng nặng.
- **Mức 0 — khối nằm:** `{colors.surface-container-lowest}` trên `{colors.surface}`, bóng rất nhẹ ấm `0 1px 8px rgba(47,41,37,0.04)` (đúng như màn Stitch).
- **Mức 1 — hover / dropdown / Sheet:** `0 4px 16px -2px rgba(47,41,37,0.05), 0 1px 3px rgba(47,41,37,0.03)`.
- **Thanh dính** (SiteHeader, BottomTabBar, ArticleActionBar): nền `{colors.surface}` 90% + `backdrop-filter: blur(12px)` + bóng 1px hướng ra ngoài.
- **Dark:** bỏ bóng; phân lớp bằng `surface-container-*-dark` và viền `{colors.outline-variant-dark}`. [ASSUMPTION]

## Shapes

Bo góc lấy theo màn Stitch (chuẩn hình ảnh), không theo đoạn văn mô tả 6px của Stitch DS:
- Thẻ, khối, Banner, AffiliateDisclosure, TOC: `{rounded.xl}`.
- Ảnh trong thẻ, nút chữ nhật, input: `{rounded.lg}`.
- Badge Loại bài: `{rounded.DEFAULT}`.
- Chip, nút tròn, nút "Đồ hay", tab đang chọn, nút trên ArticleActionBar: `{rounded.full}`.
- CMS: giữ radius mặc định của shadcn.

## Components

Icon: **Lucide**, nét 1.25–1.5px (Stitch DS §Iconography; màn Stitch dùng Material Symbols chỉ là chỗ dựng mẫu). Cột Mockup chỉ ra file chuẩn; phần đã loại ở Do's and Don'ts không tính. Khoá mockup dùng trong bảng:

- [Home-M](imports/stitch/trang-chu-meo-vat-cuoc-song-mobile.html) — Trang chủ mobile · [Home-D](imports/stitch/trang-chu-meo-vat-cuoc-song-desktop.html) — Trang chủ desktop
- [Bài-M](imports/stitch/chi-tiet-bai-viet-tay-o-noi-chien-mobile.html) — Bài viết mobile · [Bài-D](imports/stitch/chi-tiet-bai-viet-tay-o-noi-chien-desktop.html) — Bài viết desktop
- [Bio-M](imports/stitch/trang-bio-danh-muc-dong-do-noi-bat-mobile.html) — Trang bio mobile · [DM-M](imports/stitch/chi-tiet-danh-muc-do-bep-thong-minh-mobile.html) — `/bio` đã lọc Danh mục, mobile
- [Search-M](imports/stitch/trang-tim-kiem-trang-thai-rong-mobile.html) — Tìm kiếm (trạng thái rỗng) mobile

**Ánh xạ tên** (key frontmatter ↔ component): `affiliate-link-button` = phần hình "nút Shopee" của AffiliateLink · `toc` = TableOfContents · `post-card` = PostCard. CmsForm = mọi form CMS.

### Site public

| Component | Đặc tả hình ảnh | Mockup |
|---|---|---|
| **SiteHeader** | `{components.site-header}`. Mobile: logo chữ "Mẹo Vặt Cuộc Sống" + dòng phụ "Tạp chí tổ ấm nhỏ" (`{typography.label-meta}`), nút tìm kiếm. Desktop: thêm nav ngang và nút "Đồ hay" (`{colors.primary-fixed}`, `{rounded.full}`). Không avatar, không bookmark. | [Home-M], [Home-D] |
| **BottomTabBar** | `{components.bottom-tab-bar}`. 5 mục, icon 24px + nhãn; mục đang chọn đổi `{colors.primary}`, đậm 600. Chỉ mobile/tablet. | [Home-M] |
| **CategorySheet** | Sheet đáy, nền `{colors.surface-container-lowest}`, góc trên `{rounded.xl}`, danh sách Danh mục dạng dòng cao `{spacing.touch-target}`. | [Bio-M] (bottom sheet) |
| **SiteFooter** | Nền `{colors.surface-container-low}`, padding `{spacing.space-xl}`: tên + giới thiệu, link Danh mục, link `/bio`, AffiliateDisclosure dạng chữ, ©. | [Home-M] (chỉ bố cục; bỏ newsletter, trang tĩnh) |
| **Banner** | `{components.banner}`: ảnh trái/trên, tiêu đề `{typography.body-sm}` đậm 500, mô tả, CTA pill `{colors.primary}` (chỉ là hình, cả Banner là một link). Nhãn nhỏ dùng `{colors.tertiary-fixed}`. Nhiều banner: dải cuộn ngang có chấm chỉ vị trí. | [Home-M] (khối "Mùa ấm áp") |
| **PostCard** | `{components.post-card}`. Biến thể: *featured* (ảnh 16:9, badge trên ảnh, tiêu đề lớn), *grid*, *row* (thumbnail trái 80px), *rank* (số `01`–`05` `{typography.headline-lg}` màu `{colors.outline-variant}` — trang trí, `aria-hidden`, xem Colors — chữ ở bên phải). Hover: ảnh phóng 3–5%, tiêu đề đổi `{colors.primary}`. | [Home-M], [Home-D] |
| **RelatedPosts** | Tiêu đề khu `{typography.headline-md}`; mobile PostCard *row*, desktop PostCard *grid* 3 cột. | [Bài-D] (chỉ vị trí cuối bài) |
| **PostTypeBadge** | `{components.post-type-badge-meo-vat}` / `{components.post-type-badge-gom-link}`, chữ hoa. | [Home-M], [Bài-M] |
| **PostTags** | Dòng thẻ cuối thân bài: "#tag" chữ thường `{typography.label-sm}` `{colors.on-surface-variant}`, cách nhau `{spacing.space-sm}`, không nền, không link (FR-26). | — |
| **ProductCard** *row* | `{components.product-card}`. Chung cho cả hai biến thể: cả thẻ là một link (hover: nền `{colors.surface-container-low}`); phần đã loại: xem Do's and Don'ts. *row* (bài viết, `/bio`): ảnh vuông 80px bên trái; bên phải là tên tối đa 2 dòng, dòng "Giá tham khảo" `{typography.label-meta}` + giá `{colors.primary}` + "cập nhật dd/mm/yyyy" `{typography.label-meta}`, nút Shopee. Dấu Ghim (bio): icon pin trên nền `{colors.primary-fixed}`. | [Bài-M], [Bio-M], [DM-M] — chỉ lấy bố cục ảnh–tên–giá |
| **ProductCard** *tile* | Dải "Gom link đồ xinh" Trang chủ: rộng 160px trên mobile / 1 trong 4 cột desktop, ảnh 1:1 rộng hết thẻ `{rounded.lg}`, tên 2 dòng, giá + ngày, nút Shopee rộng hết thẻ. | như *row* |
| **AffiliateLink** | Không có hình riêng (hành vi: EXPERIENCE). Hình "nút Shopee" là `{components.affiliate-link-button}`: chữ "Xem trên Shopee" + icon external-link 14px, cao 36px, **vùng bấm 44px** (`hit-area`). Trong ProductCard và Banner, vùng bấm là cả thẻ. Hover: độ mờ 95%. | [Bài-M] |
| **AffiliateDisclosure** | `{components.affiliate-disclosure}`: icon tròn 28px, "Minh bạch liên kết:" đậm `{colors.on-surface}` + câu công khai. Không bao giờ giảm độ mờ. | [Bài-M] |
| **TableOfContents** | `{components.toc}`. Mobile: khối thu gọn có mũi tên; mục đánh số. Desktop: dính ở cột phải, mục đang đọc `{colors.primary}`. | [Bài-M], [Bài-D] |
| **ArticleBody** | `{typography.body-lead}`; H2 đánh số trong vòng tròn `{colors.primary-fixed}`; `blockquote` hiển thị như **Callout** `{components.callout}` ("Mẹo nhỏ"). | [Bài-M], [Bài-D] |
| **LikeButton** | Pill `{colors.surface-container-low}`, icon tim + số; đã thả: tim đặc `{colors.primary}`. | [Bài-M], [Bài-D] |
| **ShareButtons** | Nút tròn `{spacing.touch-target}`: Facebook, Threads, Sao chép link (nút cuối nền `{colors.primary}`). | [Bài-M], [Bài-D] |
| **ArticleActionBar** | `{components.article-action-bar}` dính đáy trên trang bài mobile: trái LikeButton + "Sản phẩm" (nhảy tới khối Sản phẩm); phải ShareButtons. Thay chỗ BottomTabBar trên trang bài. | [Bài-M] |
| **Breadcrumb** | Một cấp: "Trang chủ › {Danh mục}", `{typography.label-sm}`, `{colors.on-surface-variant}`. | [Bài-M], [Bài-D] (bỏ cấp 3) |
| **Pagination** | Nút "Trang trước/Trang sau" + số trang, mỗi ô ≥ `{spacing.touch-target}`; trang hiện tại nền `{colors.primary}`. [ASSUMPTION: Stitch không vẽ] | — |
| **FilterChips** | `{components.chip}`: hình cao 36px, **vùng bấm 44px** (`hit-area`), cách nhau `{spacing.space-sm}`; hàng cuộn ngang không thanh cuộn. | [Bio-M], [DM-M] |
| **SearchBox** | Input lớn nền `{colors.surface-container-lowest}`, viền `{colors.outline-variant}`, focus viền `{colors.primary}` 1.5px, icon kính lúp bên trái, nút xoá bên phải. | [Search-M] |
| **SearchResultItem** | PostCard *row* + từ khớp highlight nền `{colors.primary-fixed}`. | [Search-M] |
| **EmptyState** | Minh hoạ nét mảnh (tách trà + mầm cây) màu `{colors.primary}`/`{colors.secondary}`, tiêu đề `{typography.headline-md}`, câu gợi ý, một nút. | [Search-M] |
| **Skeleton** | Khối `{colors.surface-container}` cùng kích thước và tỉ lệ ảnh với component thật. | — |
| **ImageFallback** | Ảnh ngoài (Shopee CDN) lỗi tải: khung `{colors.surface-container}` cùng tỉ lệ, icon `image-off` `{colors.outline}` 24px giữa khung; `alt` giữ nguyên. Dùng cho ProductCard, PostCard, Banner. | — |
| **Toast** | `{components.toast}`, đáy màn, trên ArticleActionBar/BottomTabBar. | [Bài-M] |

### CMS (shadcn base-nova)

Kế thừa nguyên component shadcn; chỉ ghi **delta** so với mặc định. Delta chung: font Be Vietnam Pro; radius mặc định shadcn; trên mobile mọi `Button`, `Input`, dòng `Checkbox`/`RadioGroup` cao `{spacing.touch-target}` (shadcn mặc định 36px → nâng); nền trang `{colors.surface}`, `Card` `{colors.surface-container-lowest}`.

| Component | Dựng từ | Delta hình ảnh / anatomy |
|---|---|---|
| **CmsShell** | `Sheet`, `Sidebar` | Thanh trên dính nền `{colors.surface}`, tên mục `{typography.headline-sm}`. Mục đang chọn trong menu: nền `{colors.surface-container-high}`, chữ `{colors.primary}`. |
| **DataList** | `Card` (mobile), `Table` (desktop) | Thẻ mobile: dòng 1 tên `{typography.headline-sm}` + StatusBadge bên phải; dòng 2 meta `{typography.body-sm}` `{colors.on-surface-variant}`. Nút tạo mới dính đáy, rộng hết màn trừ lề `{spacing.margin}`. |
| **StatusBadge** | `Badge` | Luôn có chữ (không chỉ màu); bảng nhãn → token ở dưới. "Đang tạo" thêm icon `loader-circle` quay (dừng khi reduced-motion). |
| **SuggestionCard** | `Card`, `Textarea`, `Button` | Đầu thẻ, thân theo `kind`, chân thẻ: xem bên dưới. |
| **GeneratingIndicator** | `Progress` (indeterminate), `Skeleton` | Bọc `modules/suggestions/components/generating-poller.client.tsx` (AD-18). Thay thân thẻ: dòng "Đang viết {phần}…" `{typography.body-sm}` + thanh tiến trình `{colors.primary}` trên `{colors.surface-container-high}` + "0:42" `{typography.label-meta}`; dưới là 3 dòng Skeleton. |
| **RiskWarning** | `Alert` | Nền `{colors.tertiary-fixed}`, chữ `{colors.on-tertiary-fixed}`, icon `triangle-alert`; mỗi mục: câu trích (in nghiêng, 1 dòng, cắt …) + lý do `{typography.body-sm}`; mỗi mục là nút cao ≥ `{spacing.touch-target}`. Câu bị cảnh báo trong nội dung: gạch chân lượn `{colors.tertiary}`; đang được chọn: nền `{colors.tertiary-fixed}`. |
| **CopyButton** | `Button` outline sm | Icon `copy` + "Sao chép"; sau khi chép: icon `check` + "Đã sao chép" màu `{colors.secondary}` 2 giây. Vùng bấm ≥ `{spacing.touch-target}`. |
| **ResearchProfileCard** | SuggestionCard | Thân chia khu bằng tiêu đề `{typography.label-md}`: Thông tin (mỗi ý kèm link nguồn `{typography.body-sm}` `{colors.primary}`), Mô tả ảnh, Khen / Chê / Phù hợp, Người đọc mục tiêu, Góc viết, Danh mục gợi ý. Dải `skipped`: `Alert` nền `{colors.surface-container-high}`, icon `info`, đặt đầu thân. |
| **AudiencePicker / AnglePicker** | `RadioGroup` dạng thẻ | Mỗi lựa chọn là thẻ viền `{colors.outline-variant}` `{rounded.lg}`, padding `{spacing.space-md}`: tên nhóm / tên góc `{typography.label-md}` + lý do / hook `{typography.body-sm}` `{colors.on-surface-variant}`. Đã chọn: viền 2px `{colors.primary}`, nền `{colors.primary-fixed}`, chấm radio `{colors.primary}`. Bên dưới lựa chọn đang chọn: `Textarea` "Sửa lại (tuỳ chọn)". |
| **CreateContentSetPanel** | `Card`, `Checkbox`, `Button` | Khối cuối Chi tiết Sản phẩm: "Sản phẩm trong bộ" (dòng ảnh 40px + tên + StatusBadge hồ sơ), ProductPicker "Thêm Sản phẩm (bài Gom link)", PlatformToggle (3 `Checkbox` dòng), nút "Tạo bộ nội dung" primary rộng hết khối; khi tắt có dòng lý do `{typography.body-sm}` `{colors.on-surface-variant}` ngay dưới nút. |
| **ProductPicker** | `Combobox`, danh sách | Ô tìm; mỗi dòng đã chọn: ảnh 40px, tên, nút lên/xuống/gỡ dạng icon (vùng bấm `{spacing.touch-target}`). |
| **BioProductList** | danh sách `Card` | Mỗi dòng: ảnh 40px, tên, `Switch` "Hiện trên bio", nút Ghim (icon pin; đang ghim nền `{colors.primary-fixed}`), nút lên/xuống. Nhóm "Đang ghim" ở trên, ngăn bằng hairline. |
| **PostEditor** | rich text tối giản | Thanh công cụ dính trên ô soạn: H2, H3, đoạn, danh sách, trích dẫn (Callout), đậm, nghiêng — đúng phần giao của allowlist sanitize và AD-22; **không** nút link, ảnh, bảng. Vùng soạn dùng `{typography.body-lead}` như trang public. |
| **PlatformToggle** | `Checkbox` | Ba dòng "Bài web / Threads / Facebook"; dòng phụ "kèm Bình luận kèm link" `{typography.body-sm}` dưới Threads và Facebook. |
| **SeoCheckPanel** | `Card` | Điểm số `{typography.headline-lg}` + danh sách gợi ý; không màu đỏ/xanh theo điểm, chỉ số và chữ. |
| **PreviewSheet** | `Sheet` toàn màn | Nhãn "Bản xem trước" dính đỉnh nền `{colors.inverse-surface}` chữ `{colors.inverse-on-surface}`. |
| **UploadField** | `Input` file + `Progress` | Vùng thả viền đứt `{colors.outline-variant}`; ảnh xem trước theo đúng tỉ lệ đích. |
| **Dialog nhóm** (MarkPostedDialog, RegenerateDialog, SocialFromPostDialog, ConfirmDialog, UnsavedChangesGuard) | `Dialog` / `AlertDialog` | Không delta. Nút phá huỷ dùng `destructive` (= `{colors.error}`). Chip mẫu trong RegenerateDialog dùng `{components.chip}`. |
| **CmsForm** | `Field`, `Input`, `Sonner` | Lỗi tại trường `{colors.error}` `{typography.body-sm}` dưới trường; nút Lưu dính đáy trên mobile. |

#### SuggestionCard — anatomy

- **Đầu thẻ:** tên phần (`{typography.headline-sm}`: "Bài web", "Bài Threads", "Bình luận kèm link · Threads"…) + StatusBadge. RiskWarning đặt **trên** thân.
- **Thân — Bài web:** `Input` tiêu đề, `Textarea` tóm tắt, PostEditor thân bài (thu gọn 8 dòng, nút "Mở toàn bộ"), SEO trong `Accordion`.
- **Thân — chuỗi Threads:** mỗi bài một khối viền `{colors.outline-variant}` gồm số "2/6" `{typography.label-meta}`, `Textarea` tự giãn `{typography.body-regular}`; chân khối: bộ đếm "182/500" `{typography.label-meta}` `{colors.on-surface-variant}` (> 500 → `{colors.error}`) + CopyButton.
- **Thân — Facebook:** một `Textarea` + đếm từ + CopyButton.
- **Thân — Bình luận:** `Textarea` + CopyButton.
- **Chân thẻ:** mobile — "Duyệt" (`Button` primary) rộng hết thẻ; hàng dưới "Từ chối" (outline) + "Tạo lại" (ghost) chia đôi. Desktop — ba nút cùng hàng, căn phải.
- **REJECTED:** thu còn đầu thẻ + "Tạo lại".
- **FAILED:** `Alert` nền `{colors.error-container}` + "Tạo lại".

**StatusBadge — nhãn → token** (dark dùng cặp `-dark` tương ứng):

| Nhóm màu | Nền / chữ | Nhãn |
|---|---|---|
| Trung tính | `{colors.surface-container-high}` / `{colors.on-surface-variant}` | Nháp · Ẩn · Bỏ qua · Đã từ chối · Chưa đăng · Tắt · Hết hạn · Đang tạo (+ icon quay) |
| Chờ xử lý | `{colors.tertiary-fixed}` / `{colors.on-tertiary-fixed}` | Chờ duyệt · Mới · Chờ lịch |
| Xong / đang chạy | `{colors.secondary-container}` / `{colors.on-secondary-container}` | Đã duyệt · Đã xuất bản · Hiện · Đã dùng · Đã đăng · Đang hiện |
| Lỗi | `{colors.error-container}` / `{colors.on-error-container}` | Lỗi |

## Do's and Don'ts

| Do | Don't |
|---|---|
| Dùng token; đổi màu ở một chỗ (CSS variables của theme) | Viết mã hex trong component |
| Giữ mã màu Stitch "Warm Editorial Living" nguyên vẹn | Pha thêm màu "Botanical Living Editorial" (`imports/stitch/ds-botanical-living-editorial.json`, `.md`) hay màu brief cũ (#C4532F làm primary) |
| Chủ động nới padding/khoảng cách ở chỗ Stitch bị chật hoặc chữ sát mép (tối thiểu `{spacing.space-md}` trong thẻ, `{spacing.margin}` sát mép màn) — không coi là lệch chuẩn | Sao chép nguyên khoảng cách chật của Stitch |
| Nhãn công khai luôn rõ, đủ tương phản | Làm mờ, thu nhỏ hay giấu nhãn công khai |
| Giá luôn là "Giá tham khảo" kèm ngày tuyệt đối "cập nhật dd/mm/yyyy" (FR-3) | Ngày tương đối ("hôm qua"); giá gạch, % giảm, sao đánh giá, huy hiệu "Đã kiểm chứng / Top Pick / Best Seller / Organic / Shopee Mall / Đã test 6 tháng" |
| Mỗi trang đúng ở cả light và dark (NFR-11) | Nút đổi theme bằng tay ("Thử tông trầm") |
| Ảnh tỉ lệ cố định, khung chờ và khung ảnh lỗi cùng kích thước | Ảnh đầu bài carousel; khối tải muộn đẩy nội dung |
| Icon Lucide nét mảnh | Material Symbols, icon nét 2px |
| Breadcrumb một cấp theo Danh mục; hashtag là chữ thường, không link | Danh mục con, nhãn phụ, breadcrumb 3 cấp |
| Vùng bấm ≥ `{spacing.touch-target}` kể cả khi hình nhỏ hơn | Nút/chip có vùng bấm bằng đúng hình 36px |

**Phần Stitch bị loại (danh sách chuẩn)** — lý do: `reconcile-stitch.md` §3a. Không thêm lại khi chưa sửa PRD.

- avatar/tài khoản
- newsletter
- nút "Lưu"/bookmark và "lượt lưu"
- tác giả
- huy hiệu "đã kiểm chứng"
- giá gạch
- sao
- danh mục con
- lọc theo giá
- bộ sưu tập ảo
- link MXH và @handle ở bio
- khối "Bài mới nhất" trên bio
- tab "Shopee" trong tìm kiếm
- công tắc demo
- nút "Thử tông trầm"
- footer trang tĩnh
- carousel ảnh đầu bài
- khối sản phẩm ngoài bài ("Góc sắm sửa tin cậy")
