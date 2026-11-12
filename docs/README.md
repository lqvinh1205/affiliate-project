# Tài liệu dự án — Mẹo Cuộc Sống

> Kiểm lần cuối: 2026-11-05 @ 8771851 · Chuẩn viết: `chuan-tai-lieu.md`

Website blog đời sống + gom link affiliate Shopee, có CMS nội bộ dùng AI tạo nội dung cho website, Threads và Facebook. Một người vận hành (Vinh). Next.js 16, Prisma 7 + PostgreSQL, Tailwind 4 + shadcn (Base UI), Vitest. Cấu trúc theo spine kiến trúc `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` (`app → modules → platform`); spine thắng `docs/` khi mâu thuẫn. Code cũ ở `lib/`, `components/site|cms/`, `app/cms/actions.ts` đang chuyển dần (`cong-thuc/chuyen-code-cu.md`).

## Đọc gì trước

| Bạn là | Đọc |
|---|---|
| Agent bắt đầu một việc bất kỳ | `quy-dinh.md` → `kien-truc-codebase.md` → tài liệu nền tảng của phần sẽ chạm (bảng dưới) → `kiem-chung.md` |
| Người viết workflow/skill | `viet-workflow.md` → `cong-thuc/` |
| Người review | Mục **Checklist** cuối mỗi tài liệu đã dùng + `no-ky-thuat.md` |

## Mục lục

### Quy định và cách làm việc

| File | Nội dung | ID |
|---|---|---|
| `quy-dinh.md` | Luật bất di bất dịch: git, secrets, AI, affiliate, pháp lý, quyền riêng tư, xử lý spec | `[QD-xx]` |
| `quy-uoc-code.md` | Quy ước code đang dùng: thư mục, đặt tên, kiểu, Server Action, lỗi, chuỗi tiếng Việt | `[QU-xx]` |
| `kiem-chung.md` | Cách kiểm một thay đổi: test, typecheck, lint (gồm ranh giới module), build, chạy thử | `[KC-xx]` |
| `chuan-tai-lieu.md` | Cách viết tài liệu trong `docs/` | — |
| `no-ky-thuat.md` | Điểm lệch và nợ kỹ thuật đã biết, chưa sửa | `[NO-xx]` |

### Kiến trúc và nền tảng kỹ thuật

| File | Nội dung | ID |
|---|---|---|
| `kien-truc-codebase.md` | Bản đồ code: `platform/`, code cũ chờ chuyển, luồng đọc/ghi/AI, ranh giới auth và cache, bất biến liên module | `[KT-xx]` |
| `nen-tang-ky-thuat/nextjs-16.md` | Cache Components, `"use cache"`, `ensureStatic`, `updateTag`, Server Actions, `proxy.ts`, SEO | `[NX-xx]` |
| `nen-tang-ky-thuat/prisma-7.md` | Generator `prisma-client`, schema tách `prisma/schema/`, adapter pg, migration, seed, truy vấn, mô hình dữ liệu | `[PR-xx]` |
| `nen-tang-ky-thuat/giao-dien.md` | React 19, Tailwind 4, shadcn base-nova trên Base UI, theme, component, công thức UI | `[GD-xx]` |
| `nen-tang-ky-thuat/kiem-tra-va-bao-mat.md` | Zod 4, sanitize, Basic Auth + `requireAdmin`, allowlist ảnh, secrets, quyền riêng tư | `[BM-xx]` |
| `nen-tang-ky-thuat/lop-ai.md` | Lớp AI hiện tại và lớp đa nhà cung cấp dự kiến | `[AI-xx]` |

### Công thức theo đầu việc

| File | Dùng khi |
|---|---|
| `cong-thuc/them-man-hinh.md` | Thêm hoặc sửa màn hình (site hoặc CMS) theo spine: kiểm tra UI, tái sử dụng, vị trí file, checklist review |
| `cong-thuc/them-trang-public.md` | Thêm trang trong `app/(site)/` |
| `cong-thuc/them-man-cms.md` | Thêm màn quản lý trong `app/cms/` |
| `cong-thuc/them-server-action.md` | Thêm thao tác ghi hoặc truy vấn; khuôn khai báo action |
| `cong-thuc/doi-schema.md` | Đổi Prisma schema + migration; bảng phân tích ảnh hưởng |
| `cong-thuc/bo-chuc-nang.md` | Bỏ một chức năng |
| `cong-thuc/sua-loi.md` | Sửa lỗi |
| `cong-thuc/chuyen-code-cu.md` | Chạm hoặc chuyển code cũ sang cấu trúc spine (AD-17) |
| `cong-thuc/them-tinh-nang-ai.md` | Thêm tính năng dùng AI |
| `viet-workflow.md` | Tạo skill/workflow mới hoặc gắn tài liệu vào skill BMad |

### Tài liệu sản phẩm (ngoài `docs/`)

- PRD (nguồn sự thật về yêu cầu): `_bmad-output/planning-artifacts/prds/prd-affiliate-project-2026-11-03/prd.md`, kèm `addendum.md` và `research-landscape.md`.
- UX (đang làm): `_bmad-output/planning-artifacts/ux-designs/`.
- `PRD_AFFILIATE_PROJECT.md` trong thư mục này: **ý tưởng ban đầu, đã lỗi thời**. Chỉ tham khảo, không làm theo ([QD-22]).

## Bắt đầu nhanh

```bash
npm install                  # chạy luôn prisma generate (postinstall)
cp .env.example .env         # rồi điền giá trị cục bộ
docker compose up -d         # Postgres ở localhost:54329
npx prisma migrate dev
npm run db:seed              # 1 Danh mục + 10 bài mẫu (xoá bài cũ trước khi tạo)
npm run dev                  # http://localhost:3000, CMS ở /cms
```

Trước khi bàn giao: `npm test`, `npx tsc --noEmit` và `npm run lint` (`kiem-chung.md`).

## Làm việc với Claude Code

Mỗi phiên tự bật agent **Master** (`.claude/skills/master/SKILL.md`): nói yêu cầu bằng lời thường, Master chọn skill BMad phù hợp và hỏi trước các bước lớn.
