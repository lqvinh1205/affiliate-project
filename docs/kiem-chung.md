# Kiểm chứng một thay đổi

> Nguồn: `package.json`, `docker-compose.yml`, `prisma.config.ts`, `tsconfig.json`, `eslint.config.mjs` · Kiểm lần cuối: 2026-11-05 @ 8771851

Một thay đổi chỉ được báo là xong khi đã qua các bước dưới đây, và báo cáo ghi rõ bước nào đã chạy, kết quả ra sao.

## Tóm tắt cho agent

- Unit test chạy bằng `npm test` (Vitest); repo **không có script typecheck**. `npm run lint` chỉ chạy ESLint (gồm luật ranh giới module).
- Bước bắt buộc: `npm test`, `npx tsc --noEmit` và `npm run lint`, cả ba phải sạch.
- Thay đổi chạm DB hoặc giao diện thì chạy app thật để xem.
- Postgres cục bộ ở cổng **54329** (không phải 5432), bật bằng `docker compose up -d`.

## 1. Bước bắt buộc với mọi thay đổi code

- **[KC-01]** `npx tsc --noEmit` — typecheck toàn repo (tsconfig `strict: true`). Đã kiểm 2026-11-03: sạch, mã thoát 0.
- **[KC-02]** `npm run lint` — ESLint với `eslint-config-next` (core-web-vitals + typescript) và luật ranh giới module của `eslint.config.mjs` (spine AD-2, AD-17): `no-restricted-imports` chặn import trái tầng giữa module, chặn `platform/`/`components/shared|ui/` import `modules/`/`app/`, chặn `app/` import `@/platform/db` và `service.ts`, chặn import `@/lib/*`, `@/components/site|cms/*`, chặn `../`; `import/no-cycle` bật cho mọi file `.ts/.tsx`. Phạm vi chính xác: luật ranh giới áp cho `modules/**`, `platform/**`, `components/shared/**`, `components/ui/**` và `app/**` trừ các file trong `LEGACY_APP_FILES` (`eslint.config.mjs:22-34`; các file này cũng không bị luật `../`). `lib/**`, `components/site/**`, `components/cms/**` và `components/*.tsx` ở gốc không có luật ranh giới nào — "không tạo file mới ở `lib/`, `components/site|cms/`" chỉ được giữ bằng review. Test của luật ở `eslint-rules.test.ts`. Đã kiểm 2026-11-05: sạch.
- **[KC-07]** `npm test` — chạy Vitest (`vitest run`, cấu hình `vitest.config.ts`: alias `@/` theo `tsconfig`, `server-only` sang file rỗng). Test `*.test.ts` đặt cạnh file nguồn, tên tiếng Việt, không chạm DB, không gọi AI thật. Đã kiểm 2026-11-05: 10 file, 84 test xanh.
- **[KC-03]** Sửa file trong `prisma/schema/` (`_base.prisma` + `<module>.prisma`) thì chạy `npx prisma generate` trước typecheck, vì kiểu nằm trong `generated/prisma/` (gitignore).

## 2. Chạy app cục bộ

```bash
docker compose up -d          # Postgres 17 ở localhost:54329
npx prisma migrate dev        # áp migration vào DB cục bộ (chỉ DB cục bộ — [QD-07])
npm run db:seed               # 1 Danh mục + 10 bài mẫu (tuỳ chọn; xoá bài cũ trước — [NO-08])
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

Đã có Vitest cho unit test `platform/` (Story 1.2). Test tích hợp DB cho `service.ts` thêm khi có module đầu tiên; không có e2e. Mục **Running and verifying** trong `AGENTS.md` cập nhật qua `bmad-project-context` (Story 1.5).

## Checklist báo cáo

- [ ] Đã chạy `npm test` — kết quả.
- [ ] Đã chạy `npx tsc --noEmit` — kết quả.
- [ ] Đã chạy `npm run lint` — kết quả.
- [ ] Đã chạy `npm run build` (nếu chạm cache/route/config) — kết quả.
- [ ] Đã kiểm thủ công những gì (theo bảng §3), những gì chưa kiểm và vì sao.
