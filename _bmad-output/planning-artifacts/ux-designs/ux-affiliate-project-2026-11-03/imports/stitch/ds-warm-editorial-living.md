## Brand & Style

This design system embodies the warmth, mindfulness, and rustic charm of an authentic lifestyle magazine. It blends practical homemaking wisdom with curated, trustworthy affiliate recommendations. 

### Brand Personality & Emotional Tone
- **Mộc mạc & Thân tình:** Warm, natural, and down-to-earth. The experience feels like flipping through a cherished home notebook or a high-end Kinfolk-style home living publication.
- **Đáng tin cậy & Minh bạch:** Non-aggressive e-commerce cues. Product recommendations and affiliate disclosures feel like gentle peer advice rather than pushy advertisements.
- **Tinh tế & Thư thái:** Generous whitespace, fine lines, and calm earthy tones that lower sensory fatigue.

### Design Movement
**Warm Editorial Minimalism with Tactile Print Undertones.** Visual hierarchy relies on literary editorial proportions, refined 1px hairline borders (`#E8DFD3`), soft paper surfaces (`#FCF8F2`), and delicate Lucide line iconography (1.25px–1.5px stroke).

## Layout & Spacing

### Mobile-First Layout Model (Baseline: 390px)
- **Viewport Canvas:** Fluid canvas constrained to a maximum content container width of `1120px` on desktop, centered with symmetric auto margins.
- **Mobile Grid (390px - 767px):** Single-column vertical stream, 16px (`1rem`) outer screen margin, 16px internal gutter between stacked content blocks.
- **Tablet Grid (768px - 1023px):** 6-column grid with 24px gutters and 32px canvas margin.
- **Desktop Grid (1024px+):** 12-column editorial asymmetric grid (e.g., 8 columns for article/curation stream, 4 columns for sticky sidebar featuring top Shopee picks and index taxonomy).

### Spacing Principles
- Generous paragraph spacing (`space-lg`) between content modules prevents visual congestion.
- Cards maintain compact internal padding (`space-md` on mobile, `space-lg` on desktop) to retain an uncluttered, tactile index card feel.

## Elevation & Depth

This design system avoids heavy shadows, glossy glass effects, or multi-tiered synthetic depth. It relies on the tactile layering of paper and fine architectural lines.

### Elevation Principles
- **Low-Contrast Hairlines (Base Elevation 0):** Surfaces distinguish themselves through a 1px border of `#E8DFD3` on light canvas `#FCF8F2`.
- **Resting Cards:** Flat white `#FFFFFF` surface resting on `#FCF8F2` with zero box-shadow, framed purely by the 1px neutral hairline.
- **Interactive Hover & Subtle Floating (Elevation 1):** Soft, warm-tinted ambient shadow applied sparingly on hovered cards or dropdown menus:
  - `box-shadow: 0 4px 16px -2px rgba(47, 41, 37, 0.05), 0 1px 3px 0 rgba(47, 41, 37, 0.03)`
- **Sticky Bars & Notification Drawers:** Floating top navigation and sticky affiliate bottom sheets use pure `#FCF8F2` with a 1px bottom/top border `#E8DFD3` and low-opacity warm ambient blur (`backdrop-filter: blur(12px)` with 92% background opacity).

## Components

### 1. Affiliate Disclosure Banner
- **Container:** Background `#F5EFE6`, border 1px solid `#E8DFD3`, border-radius 6px, padding `12px 16px`.
- **Icon:** Lucide `Info` or `HeartHandshake` (16px, color `#73685F`).
- **Typography:** `body-sm` with `#73685F`. Transparently states: *"Một số liên kết là link tiếp thị liên kết (Shopee). Khi bạn mua sắm qua đây, chúng mình nhận được chút hoa hồng nhỏ để duy trì tạp chí."*

### 2. Shopee Affiliate Link / Product Card
- **Structure:** Two-column horizontal card on mobile (thumbnail 80x80px with 4px radius, title, curated note, price, CTA).
- **Badge:** "Đã kiểm chứng" or "Gom link" tag using Sage Green or Terracotta badge tokens.
- **Button ("Xem trên Shopee"):**
  - Background `#FCF8F2`, border 1px solid `#C4532F`, text color `#C4532F`, border-radius 4px, height 36px, font `label-sm`.
  - Icon: Lucide `ExternalLink` (14px).
  - Hover state: Background `#F6E6DD`, no aggressive red or flashing promotional graphics.

### 3. Editorial Post Card
- **Surface:** `#FFFFFF` background, 1px solid border `#E8DFD3`, 6px corner radius.
- **Hierarchy:** 16:10 aspect ratio image, followed by category badge ("Mẹo vặt" or "Gom link"), article title (`headline-md`), excerpt (`body-regular`), and author/read-time metadata (`label-meta`).

### 4. Buttons
- **Primary Action:** Solid terracotta `#C4532F` fill, white `#FFFFFF` text, radius 6px, height 42px, font `label-md`. Hover: `#B34A2A`.
- **Secondary Action:** Transparent fill, border 1px solid `#E8DFD3`, text `#2F2925`. Hover: background `#F5EFE6`.
- **Ghost Action:** Borderless, text `#73685F`, hover text `#2F2925` with background `#F5EFE6`.

### 5. Categorical Badges & Chips
- **Tip Badge ("Mẹo vặt"):** Surface `#E3F0E6`, text `#4A7A5E`, border 1px solid rgba(74, 122, 94, 0.15), 4px radius, uppercase `label-meta`.
- **Affiliate Badge ("Gom link"):** Surface `#F6E6DD`, text `#B34A2A`, border 1px solid rgba(179, 74, 42, 0.15), 4px radius, uppercase `label-meta`.

### 6. Inputs & Search Fields
- **Container:** Background `#FFFFFF`, border 1px solid `#E8DFD3`, radius 6px, padding 10px 14px, font `body-regular`.
- **Focus State:** Border `#C4532F` (1.5px), outline none.
- **Placeholder:** `#73685F` with reduced opacity.

### 7. Iconography Standard
- **Library:** Lucide Icons.
- **Stroke Width:** 1.25px to 1.5px (never 2px bold) to maintain an organic, fine-drawn line aesthetic compatible with Be Vietnam Pro.