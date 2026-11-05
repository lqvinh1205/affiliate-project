# Viết workflow cho dự án

> Nguồn: cấu trúc skill BMad 6.12.4 trong `.claude/skills/`, `_bmad/scripts/`, `.claude/skills/master/SKILL.md`; mẫu tham khảo bộ workflow công ty cũ (`~/Downloads/_bmad (1)/_bmad/bmm/workflows/`, BMad 6.0.0-Beta.7) · Kiểm lần cuối: 2026-11-05 @ 8771851

Hướng dẫn tạo workflow (skill) mới cho affiliate-project, hoặc gắn tài liệu dự án vào skill BMad có sẵn. Workflow tốt ở đây = **nạp đúng tài liệu → nhận đủ đầu vào → làm theo pha có điểm dừng → tự kiểm → báo cáo theo khuôn**.

## Tóm tắt cho agent

- Workflow của dự án là một **skill Claude Code** trong `.claude/skills/<ten>/SKILL.md`. Không đặt tên bắt đầu bằng `bmad-` (tránh bị trình cài BMad ghi đè).
- Workflow **trỏ tới** tài liệu `docs/` bằng ID mục (`[QD-08]`, `[NX-03]`), không chép nội dung.
- Muốn skill BMad có sẵn (ví dụ `bmad-build`) tự nạp tài liệu dự án: dùng **customization** (`persistent_facts`), không sửa file của skill BMad.
- Mọi workflow tuân `docs/quy-dinh.md`; không commit ([QD-01]).
- Điểm dừng (gate) và câu hỏi BLOCKER/MINOR ([QD-23]) là bắt buộc trong workflow có sửa code.

## 1. Hai cách mở rộng

### 1.1 Gắn tài liệu dự án vào skill BMad có sẵn

Skill BMad đọc `customize.toml` của nó rồi gộp với `_bmad/custom/<skill>.toml` (đội) và `_bmad/custom/<skill>.user.toml` (cá nhân). Khoá `persistent_facts` nhận dòng chữ hoặc `file:` + đường dẫn/glob, được nạp khi skill khởi động.

```toml
# _bmad/custom/bmad-build.toml
[workflow]
persistent_facts = [
  "file:docs/quy-dinh.md",
  "file:docs/quy-uoc-code.md",
  "file:docs/kien-truc-codebase.md",
]
```

- Kiểm kết quả gộp: `uv run _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-build --project-root . --key workflow`.
- Skill `bmad-customize` làm việc này có hướng dẫn và kiểm tra. Ưu tiên dùng nó.
- Chỉ nạp tài liệu skill thực sự cần; mỗi file nạp tốn ngữ cảnh mỗi lần chạy. Tài liệu nền tảng kỹ thuật nên để workflow tự đọc khi chạm đúng phần (xem §3 bước 1).
- `customize.toml` của skill BMad ghi "DO NOT EDIT — overwritten on every update". Không sửa nó.

### 1.2 Viết skill mới của dự án

Cấu trúc thư mục:

```
.claude/skills/<ten-workflow>/
├── SKILL.md            # bắt buộc: frontmatter + quy trình
├── steps/              # tuỳ chọn: mỗi pha một file khi quy trình dài
│   ├── 01-intake.md
│   └── 02-...md
└── templates/          # tuỳ chọn: khuôn output (báo cáo, Q&A, checklist)
```

Frontmatter `SKILL.md`:

```markdown
---
name: <ten-workflow>
description: <làm gì> — <khi nào dùng>. Use when the user says "<câu kích hoạt 1>" or "<câu kích hoạt 2>"
---
```

- `description` quyết định khi nào Claude chọn skill (và khi nào `master` định tuyến tới). Ghi rõ câu kích hoạt.
- Sau khi tạo, thêm skill vào mục **Định tuyến** của `.claude/skills/master/SKILL.md` để Master biết gọi nó.
- Skill mới chỉ xuất hiện ở phiên Claude Code mở sau khi tạo.

## 2. Khuôn một workflow

Rút từ bộ workflow công ty cũ (`entry.md` + `workflow.md`), điều chỉnh cho dự án này.

```markdown
# <Tên workflow>

## Vai trò
Một đoạn: workflow giải quyết việc gì, đầu ra là gì, đứng ở đâu so với các workflow khác.

## Khởi động
1. Chạy `uv run {project-root}/_bmad/scripts/resolve_config.py --project-root {project-root}`; lấy `user_name`, `communication_language`, `planning_artifacts`, `implementation_artifacts`.
2. Đọc BẮT BUỘC:
   - `docs/quy-dinh.md`
   - `docs/kien-truc-codebase.md`
   - <tài liệu nền tảng theo phần sẽ chạm, xem bảng §3>
3. Đọc nếu có: PRD, tài liệu kiến trúc, story liên quan.

## Bước 1 — Nhận việc
[BẮT BUỘC]
1. ...
[TUỲ CHỌN]
2. ...
Thiếu mục BẮT BUỘC → hỏi lại, không bắt đầu.

## Bước 2..N — Các pha
Mỗi pha: mục tiêu · việc làm · tài liệu trỏ tới (ID) · điều kiện xong.
Đánh dấu ĐIỂM DỪNG ở chỗ cần người duyệt (ví dụ sau khi lập kế hoạch, trước khi sửa nhiều file).

## Câu hỏi khi spec chưa rõ
BLOCKER → dừng, hỏi. MINOR → làm theo giả định, ghi lại ([QD-23]). Dùng khuôn `templates/qa.md`.

## Tự kiểm
Chạy `docs/kiem-chung.md` + checklist của các tài liệu nền tảng đã dùng.

## Báo cáo
Khuôn `templates/bao-cao.md`: đã làm gì · file đã đổi · kết quả kiểm chứng · Q&A còn mở · giả định · bước tiếp theo.
```

## 3. Bản đồ tài liệu theo phần code

Workflow chọn tài liệu nền tảng cần đọc dựa trên phần code sẽ chạm:

| Chạm vào | Đọc |
|---|---|
| `app/**`, `proxy.ts`, `next.config.ts`, caching | `docs/nen-tang-ky-thuat/nextjs-16.md` |
| `prisma/**`, `platform/db.ts`, `queries.ts`/`cms-queries.ts`/`service.ts`, truy vấn | `docs/nen-tang-ky-thuat/prisma-7.md` |
| `components/**`, `modules/*/components/**`, `app/globals.css`, giao diện | `docs/nen-tang-ky-thuat/giao-dien.md` |
| Form, Server Action, HTML bài, auth, ảnh (`platform/auth`, `platform/html`, `platform/validation`, `platform/images.ts`) | `docs/nen-tang-ky-thuat/kiem-tra-va-bao-mat.md` |
| `lib/ai.ts` (code cũ), `platform/ai`, `modules/*/prompts/`, mọi tính năng AI | `docs/nen-tang-ky-thuat/lop-ai.md` |
| Mọi thay đổi code | `docs/quy-uoc-code.md`, `docs/kiem-chung.md`; chạm code cũ (`lib/`, `components/site|cms/`, `app/cms/actions.ts`) thì thêm `docs/cong-thuc/chuyen-code-cu.md` |
| Vùng code có nợ kỹ thuật | `docs/no-ky-thuat.md` |

Công thức từng bước cho việc hay gặp nằm trong `docs/cong-thuc/` — workflow nên gọi công thức thay vì tự mô tả lại.

## 4. Nguyên tắc rút ra từ bộ workflow cũ

- **Tài liệu là trọng tài.** Kỳ vọng lấy từ spec (PRD, kiến trúc), không lấy từ code hiện tại. Code chỉ cho biết đang có gì.
- **Đầu vào bắt buộc rõ ràng.** Thiếu thì không chạy, tránh agent tự bịa đầu vào.
- **Có cổng (gate) giữa các pha lớn**, kèm tiêu chí qua cổng đo được.
- **Q&A tách BLOCKER / MINOR**, không âm thầm chọn một cách hiểu.
- **Mẫu vàng (golden pattern).** Lần đầu làm một loại việc, người review kỹ từng dòng; kết quả trở thành mẫu cho các lần sau, ghi đường dẫn vào workflow.
- **Không sửa code ngoài phạm vi workflow.** Thấy lỗi khác thì ghi vào báo cáo.

## 5. Workflow dự kiến cho dự án

Gợi ý, chưa xây. Mỗi cái nên đi qua `bmad-architecture` trước khi viết, vì nó phụ thuộc mô hình dữ liệu mới.

- `them-man-cms` — thêm một màn CMS (form + Server Action + validate + toast).
- `them-tinh-nang-ai` — thêm một tính năng AI qua lớp AI, có schema, prompt, Duyệt.
- `them-trang-public` — thêm trang public có cache, SEO, dark mode.
- `doi-schema` — thay đổi Prisma schema + migration + cập nhật truy vấn và cache.
- `kiem-tra-tuan-thu` — rà một thay đổi theo `docs/quy-dinh.md` (link affiliate, nhãn, secrets).

## Checklist khi viết một workflow mới

- [ ] Tên không bắt đầu bằng `bmad-`; `description` có câu kích hoạt.
- [ ] Phần Khởi động liệt kê tài liệu BẮT BUỘC, trỏ bằng đường dẫn và ID.
- [ ] Có mục đầu vào BẮT BUỘC / TUỲ CHỌN.
- [ ] Có điểm dừng trước thay đổi lớn.
- [ ] Có Q&A BLOCKER / MINOR.
- [ ] Có bước tự kiểm theo `docs/kiem-chung.md`.
- [ ] Có khuôn báo cáo.
- [ ] Không commit; tuân `docs/quy-dinh.md`.
- [ ] Đã thêm vào mục Định tuyến của `master`.
