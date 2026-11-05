# Công thức: thay đổi Prisma schema

> Nguồn: spine kiến trúc `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` (AD-4, AD-14, AD-15, AD-17), `docs/nen-tang-ky-thuat/prisma-7.md` · Kiểm lần cuối: 2026-11-04

Dùng khi thêm, sửa hoặc xoá model, trường, enum, quan hệ, index. `bmad-build` nạp công thức này; reviewer chấm diff theo mục **Checklist**.

## Tóm tắt cho agent

- **Phân tích ảnh hưởng trước khi code.** Spec phải có **Bảng phân tích ảnh hưởng** (Bước 2), Vinh duyệt ở CHECKPOINT 1.
- **Phá dữ liệu = BLOCKER.** Xoá/đổi tên cột, bảng, giá trị enum hoặc đổi `onDelete` thành `Cascade` → dừng, hỏi Vinh ([QD-23]).
- **Chỉ DB cục bộ** (cổng 54329). Không chạy `migrate`, `db push`, `db seed` vào production; production chỉ Vinh áp ([QD-07], `[PR-24]`).
- **Mỗi model ở file của module chủ** `prisma/schema/<module>.prisma`, chủ theo bảng *Chủ sở hữu bảng* của spine (AD-4). Bảng không có trong bảng đó → `[SCHEMA-UNKNOWN]`, hỏi (AD-15).
- **`@db.VarChar(n)` bằng đúng hằng số** giới hạn trong `constants.ts` của module chủ (AD-14, AD-25).
- **Migration tạo bằng `--create-only`, đọc SQL rồi mới áp.** Không sửa migration đã áp (AD-15, `[PR-13]`).

## Đọc trước

- Spine: AD-4, AD-14, AD-15, AD-17, AD-25, **Consistency Conventions** (dòng Prisma, Id, Giá, Trường tuỳ chọn), **Structural Seed** (Chủ sở hữu bảng, ERD).
- Prisma: `[PR-02]`, `[PR-07]`, `[PR-08]`, `[PR-13]`, `[PR-14]`, `[PR-17]`, `[PR-21]`, `[PR-24]`, `[PR-27]`.
- Quy định: `[QD-02]`, `[QD-07]`, `[QD-23]`, `[QD-24]`. Nợ liên quan: `[NO-08]` (seed xoá hết bài).

## Bước 1: Xác định thay đổi

1. Liệt kê từng model / trường / enum / quan hệ / index thay đổi và FR nó phục vụ.
2. Xác định module chủ (AD-4). Cột mới chỉ thêm vào model của chính module đó; module khác chỉ được thêm trường quan hệ ngược.
3. File đích: `prisma/schema/<module>.prisma` (sau migration nền của AD-17). Trước khi epic nền tách schema, không tự tách — sửa `prisma/schema.prisma` hoặc chờ epic nền.

## Bước 2: Bảng phân tích ảnh hưởng (bắt buộc trong spec, trước khi code)

**a. Tìm nơi dùng.** Với mỗi model, trường, enum bị chạm:

```bash
grep -rn "<Model>\|<field>" modules platform app prisma lib components
grep -rn "<ENUM_VALUE>" modules platform app prisma lib components
grep -rn "<field>" prisma/migrations | tail -5   # index/CHECK viết tay đang dựa vào cột
```

**b. Ghi mỗi chỗ bị ảnh hưởng thành một dòng.** Không có chỗ nào thì ghi "không có" — không bỏ dòng.

| Hạng mục | File / ký hiệu bị ảnh hưởng | Việc phải làm |
|---|---|---|
| Query public | `queries.ts`, `publicProductSelect`, `visibleProductWhere` | sửa `select`/`where`, giữ `cacheTag` |
| Query CMS | `cms-queries.ts` | sửa `select` |
| Kiểu | `types.ts` (suy từ select, `[PR-17]`) | |
| Validate + form | `schema.ts`, `constants.ts`, form RHF dùng schema đó (AD-14) | |
| Ghi | `service.ts` của module chủ, `actions.ts` | |
| Cache tag | `tags.ts`, mọi `updateTag` liên quan (AD-7) | |
| Module khác đọc qua AD-2 | `queries.ts`/`types.ts`/`components/` của module khác import kiểu hoặc select này | |
| Seed | `prisma/seed.ts` | |
| Test | `*.test.ts` của `schema.ts`/`service.ts` (AD-16) | |
| Code cũ | `lib/*`, `app/cms/actions.ts`, `components/site|cms/*` | chuyển theo `chuyen-code-cu.md` |

**c. Phân loại** mỗi thay đổi:

| Loại | Gồm | Xử lý |
|---|---|---|
| **an toàn** | thêm cột nullable hoặc có `@default`, thêm bảng, thêm index | làm theo Bước 3 |
| **cần chuyển dữ liệu** | thêm cột NOT NULL không default, tách bảng, đổi kiểu cột, chuyển dữ liệu giữa bảng | SQL chuyển dữ liệu viết tay trong cùng migration; ghi cách kiểm dữ liệu sau chuyển vào spec |
| **phá dữ liệu** | xoá hoặc đổi tên cột/bảng/giá trị enum, đổi `onDelete` thành `Cascade` | **BLOCKER**: dừng, hỏi Vinh trước khi code |

**d. Với "phá dữ liệu"**, spec ghi thêm: dữ liệu nào mất; có cần sao lưu hay chuyển trước không; cách áp lên production. Agent không chạm production; Vinh tự sao lưu và tự áp ([QD-07]). Nơi chạy Postgres production còn chờ quyết định (spine **Deferred**; `.env.example` đang giả định Supabase) — ghi rõ giả định trong spec.

## Bước 3: Sửa schema và tạo migration

1. Kiểm `.env` trỏ cục bộ mà không in mật khẩu: `grep -o '@[^/]*' .env` phải ra `@localhost:54329` (`[PR-13]`). Bật DB: `docker compose up -d`.
2. Sửa `prisma/schema/<module>.prisma` theo Consistency Conventions và `[PR-07]`: `id String @id @default(uuid())`, `createdAt`/`updatedAt`, mỗi quan hệ ghi rõ `onDelete` (AD-15), `@@index` cho khoá ngoại và cột lọc. Bảng nối khai báo tường minh (AD-4).
3. Chuỗi có giới hạn: `@db.VarChar(n)` với `n` bằng hằng số trong `constants.ts` của module chủ; cập nhật hằng số và `schema.ts` cùng lúc (AD-14, AD-25).
4. Enum: chỉ cho tập cố định mà code rẽ nhánh; giá trị dùng trong code lấy từ `@/generated/prisma/enums`, không gõ lại (AD-5, `[PR-27]`). Tập do Vinh quản lý → bảng (AD-15). `Json` chỉ khi có Zod theo loại trong module chủ.
5. Tạo migration, tên `verb_object` snake_case:

   ```bash
   npx prisma migrate dev --create-only --name <verb_object>
   ```

6. Đọc `migration.sql` vừa sinh. Đúng như bảng 2c? Có `DROP` ngoài dự kiến → dừng, quay lại 2c.
7. Viết tay vào SQL những gì Prisma không sinh: CHECK, partial unique index, index đặc biệt, SQL chuyển dữ liệu. Mỗi mục có comment `///` tương ứng ở model trong `.prisma` (AD-15).
8. Áp và sinh client:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

9. Gộp mọi thay đổi schema của story vào **một** migration; không có hai story đang làm cùng tạo migration (AD-15). Không sửa migration đã áp.
10. Cập nhật mọi dòng của bảng 2b, theo thứ tự `constants.ts` → `schema.ts` → `types.ts` → `service.ts` → `queries.ts`/`cms-queries.ts` → `actions.ts` → form → `seed.ts`.

## Bước 4: Kiểm chứng

```bash
npx prisma migrate reset   # chỉ DB cục bộ — xoá sạch, áp lại toàn bộ migration
npm run db:seed
npx tsc --noEmit && npm run lint
```

- `docs/kiem-chung.md` §1 và dòng "Schema/migration" ở §3; `npm run build` khi chạm query public hoặc cache.
- Có Vitest (sau epic nền): test `schema.ts` cho giới hạn mới; test tích hợp `service.ts` (AD-16).
- Thay đổi "cần chuyển dữ liệu": chạy migration trên DB cục bộ **đang có dữ liệu seed** trước khi reset, kiểm dữ liệu sau chuyển như spec ghi.

## Checklist

- [ ] Spec có Bảng phân tích ảnh hưởng đủ 2a–2c; mọi dòng 2b đã xử lý hoặc ghi "không có".
- [ ] Không có thay đổi "phá dữ liệu" chưa được Vinh duyệt; spec ghi cách xử lý production ([QD-07], [QD-23]).
- [ ] Model nằm trong `prisma/schema/<module chủ>.prisma`; module khác chỉ thêm trường quan hệ ngược; bảng mới có trong bảng *Chủ sở hữu bảng* (AD-4, AD-15).
- [ ] Mỗi quan hệ có `onDelete` đúng loại; bảng nối tường minh (AD-4, AD-15).
- [ ] `@db.VarChar(n)` khớp hằng số trong `constants.ts`; `schema.ts` dùng cùng hằng số (AD-14, AD-25).
- [ ] Enum không bị gõ lại trong code; `Json` có Zod theo loại (AD-5, AD-15).
- [ ] Migration tạo bằng `--create-only`, tên `verb_object`, đã đọc SQL; CHECK/partial index viết tay có comment trong `.prisma` (AD-15).
- [ ] Một migration cho story; không sửa migration đã áp (AD-15, `[PR-13]`).
- [ ] Đã `npx prisma generate`; không sửa `generated/` ([QD-02], `[PR-21]`).
- [ ] Chỉ chạy lệnh ghi vào `localhost:54329`; `migrate reset` + `db:seed` cục bộ chạy sạch ([QD-07]).
- [ ] Query đổi vẫn gắn đủ tag; ghi đổi vẫn `updateTag` đủ tag (AD-7).
- [ ] Mọi mục trong **Checklist khi review** của `docs/quy-dinh.md`.
