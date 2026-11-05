## Brand & Style

This design system expresses a serene, botanical slow-living aesthetic designed for intentional home curation, sustainable kitchen living, and mindful lifestyle journalism. Moving away from generic mass-market commerce palettes and hyper-active consumer interfaces, it embraces a grounded editorial sensibility rooted in wabi-sabi philosophy, natural textures, and organic craftsmanship.

### Brand Personality & Emotional Tone
- **Mộc mạc & Bản sắc (Earthy & Grounded):** Anchored by deep moss and evergreen foliage tones, balanced by the tactile warmth of handcrafted pottery and unbleached paper.
- **Sang trọng & Thư thái (Quiet Luxury & Slow Living):** Unhurried visual pacing, expansive negative space, and refined typographical details that transform shopping and tip-reading into a restorative sanctuary.
- **Minh bạch & Độc bản (Authentic & Discerning):** Rejecting flashing commercial patterns. Curated links, product vignettes, and housekeeping essays read like trusted recommendations from a seasoned designer's personal journal.

### Design Movement
**Botanical Editorial Minimalism with Tactile Wabi-Sabi Sensibilities.** The interface draws directly from premium indie publications and architectural monographs. Structure is defined by delicate 1px natural stone hairlines, warm unbleached parchment canvas, organic deep forest moss, and accents of terracotta stoneware clay.

## Layout & Spacing

Layout geometry follows an asymmetric editorial grid inspired by modern culinary and architectural journals. 

### Grid & Viewport Structure
- **Max Canvas Width:** Constrained to `1160px` centered on wide viewports to preserve comfortable editorial line lengths (60–75 characters per line).
- **Mobile (320px – 767px):** Single-column layout with `1rem` outer canvas padding and `1rem` vertical stacking gap.
- **Tablet (768px – 1023px):** 6-column grid with `1.5rem` gutters and `2rem` screen margin.
- **Desktop (1024px+):** 12-column editorial grid. Long-form articles and curation collections span an 8-column main track, with a 4-column sticky sidebar for seasonal pantry picks, curated Shopee finds, and curated taxonomy.

### Spacing Cadence
- Content sections are spaced rhythmically using `space-xl` (40px) to prevent cognitive overload.
- Component-level spacing relies on clean 4px/8px multiples (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 16px, `space-lg` = 24px).

## Elevation & Depth

Visual hierarchy is constructed through tonal surface layering and tactile print hairlines rather than dramatic drop shadows or synthetic glass blurs.

### Tonal Hierarchy
- **Base Layer (Elevation 0):** The natural parchment canvas (`#FAF7F2`) serves as the ground plane.
- **Resting Containers & Cards (Elevation 1):** Crisp white (`#FFFFFF`) or warm sand (`#F2ECE2`) surfaces framed cleanly by a 1px solid stoneware hairline border (`#E3DCD1`). Zero resting shadow creates a flat, tactile index-card feel.
- **Floating & Interactive State (Elevation 2):** When interacting with product cards, dropdown menus, or contextual cards, elements apply an ambient, warm-tinted shadow with a slight olive undertone:
  - `box-shadow: 0 6px 20px -4px rgba(36, 40, 36, 0.06), 0 2px 6px -1px rgba(36, 40, 36, 0.03)`
- **Sticky Headers & Drawers:** Filter bars and sticky recommendation trays feature 92% opacity on `#FAF7F2` with `backdrop-filter: blur(12px)` and a crisp 1px hairline bottom border (`#E3DCD1`), ensuring quiet continuity while scrolling.

## Components

### 1. Affiliate & Editorial Disclosure Banner
- **Container:** Background `#F2ECE2`, border 1px solid `#E3DCD1`, border radius 6px, padding `12px 16px`.
- **Icon:** Lucide `Sprout` or `HeartHandshake` (16px, color `#5D6A53`).
- **Typography:** `body-sm`, color `#6E756B`. Transparent and serene: *"Một số đề xuất đồ gia dụng đi kèm liên kết tiếp thị liên kết (Shopee). Mỗi đơn hàng nhỏ của bạn giúp duy trì không gian tạp chí mộc này mà không làm tăng giá sản phẩm."*

### 2. Shopee Curation / Product Card
- **Structure:** Horizontal layout on mobile; vertical card on desktop grid. 
- **Image Vignette:** Neutral border 1px `#E3DCD1`, aspect ratio 1:1, corner radius 4px.
- **Header:** Category tag ("Góc Bếp", "Tổ Ấm Xanh") in `label-meta`.
- **Body:** Product title in `headline-sm` (`#242824`), followed by a brief personal review note in `body-sm` (`#6E756B`).
- **Action Button ("Xem nơi mua uy tín"):**
  - Outlined state: Background `#FAF7F2`, border 1px solid `#2D5A43`, text `#2D5A43`, font `label-sm`.
  - Icon: Lucide `ExternalLink` (14px).
  - Hover state: Background `#E8F0EA`, text `#2D5A43`.
  - Terracotta Highlight Variant (Best Value): Border `#B85D38`, text `#B85D38`, hover background `#F7EDE8`.

### 3. Buttons
- **Primary Action (Subscribe, Filter, Core CTA):** Solid Deep Olive Moss `#2D5A43` background, white `#FFFFFF` text, radius 6px, height 42px, typography `label-md`. Hover: `#234734`.
- **Warm Accent Action (Direct Shopee Buy / Limited Highlight):** Solid Terracotta `#B85D38` background, white text. Hover: `#9E4D2C`.
- **Secondary Action:** Transparent fill, border 1px solid `#E3DCD1`, text `#242824`. Hover: background `#F2ECE2`.
- **Ghost Action:** Borderless, text `#6E756B`, hover text `#242824` with background `#F2ECE2`.

### 4. Categorical Badges & Chips
- **Mẹo Tổ Ấm (Green Living & Housekeeping):** Background `#E8F0EA`, text `#2A563E`, border 1px solid rgba(42, 86, 62, 0.15), radius 4px, `label-meta` in uppercase.
- **Gom Link / Đồ Xinh (Curated Finds):** Background `#F7EDE8`, text `#B85D38`, border 1px solid rgba(184, 93, 56, 0.15), radius 4px, `label-meta` in uppercase.
- **Đã Dùng & Kiểm Chứng (Verified Pick):** Background `#F2ECE2`, text `#5D6A53`, border 1px solid `#E3DCD1`, radius 4px.

### 5. Input Fields & Search Bars
- **Surface:** `#FFFFFF` background, border 1px solid `#E3DCD1`, border radius 6px, padding `10px 14px`, text `#242824`, font `body-regular`.
- **Focus State:** Border 1.5px solid `#2D5A43`, no harsh outer glow.
- **Placeholder:** `#6E756B` with 70% opacity.

### 6. Iconography Rules
- **Library:** Lucide Icons.
- **Weight:** Fixed stroke width of 1.25px to 1.5px to harmonize with the delicate lines of Be Vietnam Pro. Never use 2px heavy strokes.