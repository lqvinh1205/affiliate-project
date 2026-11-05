# Kiểm chứng một thay đổi

> Nguồn: `package.json`, `docker-compose.yml`, `prisma.config.ts`, `tsconfig.json`, `eslint.config.mjs` · Kiểm lần cuối: 2026-11-03 @ dfd7e8f

Một thay đổi chỉ được báo là xong khi đã qua các bước dưới đây, và báo cáo ghi rõ bước nào đã chạy, kết quả ra sao.

## Tóm tắt cho agent

- Repo **không có test suite** và **không có script typecheck**. `npm run lint` chỉ chạy ESLint.
- Bước bắt buộc: `npx tsc --noEmit` và `npm run lint`, cả hai phải sạch.
- Thay đổi chạm DB hoặc giao diện thì chạy app thật để xem.
- Postgres cục bộ ở cổng **54329** (không phải 5432), bật bằng `docker compose up -d`.

## 1. Bước bắt buộc với mọi thay đổi code

- **[KC-01]** `npx tsc --noEmit` — typecheck toàn repo (tsconfig `strict: true`). Đã kiểm 2026-11-03: sạch, mã thoát 0.
- **[KC-02]** `npm run lint` — ESLint với `eslint-config-next` (core-web-vitals + typescript). Đã kiểm 2026-11-03: sạch.
- **[KC-03]** Sửa `prisma/schema.prisma` thì chạy `npx prisma generate` trước typecheck, vì kiểu nằm trong `generated/prisma/` (gitignore).

## 2. Chạy app cục bộ

```bash
docker compose up -d          # Postgres 17 ở localhost:54329
npx prisma migrate dev        # áp migration vào DB cục bộ (chỉ DB cục bộ — [QD-07])
npm run db:seed               # 10 bài mẫu (tuỳ chọn)
npm run dev                   # http://localhost:3000
```

- **[KC-04]** CMS ở `/cms`, đăng nhập HTTP Basic bằng `ADMIN_USERNAME` / `ADMIN_PASSWORD` trong `.env`. Không in giá trị này ra ([QD-05]).
- **[KC-05]** Tính năng AI cần khoá API trong `.env`; thiếu khoá thì lỗi tiếng Việt, không phải crash.
- **[KC-06]** `npm run build` bắt được lỗi mà dev server bỏ qua (ví dụ vi phạm quy tắc cache khi `cacheComponents: true`, xem `docs/nen-tang-ky-thuat/nextjs-16.md`). Chạy khi thay đổi chạm caching, route hay `next.config.ts`.

## 3. Kiểm theo loại thay đổi

| Thay đổi | Kiểm thêm |
|---|---|
| Schema/migration | Migration tạo được trên DB trống (`npx prisma migrate reset` trên DB **cục bộ**), seed chạy được |
| Server Action | Gọi khi chưa đăng nhập phải bị từ chối; dữ liệu sai trả lỗi tiếng Việt |
| Trang public | Xem ở 360px và desktop, sáng và tối; xem nguồn trang có metadata/JSON-LD đúng |
| Ghi dữ liệu hiển thị public | Sau khi lưu, trang public cập nhật mà không cần build lại (`updateTag`) |
| Link affiliate | Thuộc tính `rel`/`target` đúng ([QD-14]) |
| Tính năng AI | Chạy thật một lần; thử khi thiếu khoá; output sai schema bị chặn |

## 4. Dự kiến

Chưa có framework test. Khi thêm (ví dụ Vitest cho `lib/` và Playwright cho luồng CMS), cập nhật tài liệu này và mục **Running and verifying** trong `AGENTS.md` (qua `bmad-project-context`).

## Checklist báo cáo

- [ ] Đã chạy `npx tsc --noEmit` — kết quả.
- [ ] Đã chạy `npm run lint` — kết quả.
- [ ] Đã chạy `npm run build` (nếu chạm cache/route/config) — kết quả.
- [ ] Đã kiểm thủ công những gì (theo bảng §3), những gì chưa kiểm và vì sao.
