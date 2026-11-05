# Công thức: sửa lỗi

> Nguồn: spine kiến trúc `_bmad-output/planning-artifacts/architecture/architecture-affiliate-project-2026-11-03/ARCHITECTURE-SPINE.md` (AD-16, AD-17), `docs/quy-dinh.md`, `docs/no-ky-thuat.md` · Kiểm lần cuối: 2026-11-04

Dùng khi sửa một lỗi: hành vi sai so với PRD, spine hoặc quy định. `bmad-build` nạp công thức này; reviewer chấm diff theo mục **Checklist**.

## Tóm tắt cho agent

- **Tái hiện trước, sửa sau.** Không tái hiện được → không sửa; ghi lại và hỏi.
- **Sửa nguyên nhân gốc, không che triệu chứng** (không `try/catch` nuốt lỗi, không `?? ""` cho qua).
- **Test đỏ trước khi sửa** khi đã có Vitest (sau epic nền) và lỗi kiểm được bằng unit/tích hợp (AD-16).
- **Đúng phạm vi.** Chỉ sửa lỗi được giao; thấy lỗi khác thì ghi lại, đề xuất ([QD-24]).
- **Lỗi lộ ra spec thiếu hoặc mâu thuẫn** → câu hỏi theo [QD-23], không tự chọn hành vi.

## Đọc trước

- `docs/no-ky-thuat.md`: lỗi có thể đã được ghi (`[NO-xx]`).
- Spine: AD-16, AD-17 và AD của vùng bị lỗi (Capability → Architecture Map).
- Quy định: `[QD-22]`, `[QD-23]`, `[QD-24]`. Lỗi bảo mật/tuân thủ: thêm `[QD-12]`–`[QD-16]`, `[QD-20]`, `[QD-21]`.
- `docs/kiem-chung.md`.

## Bước 1: Tái hiện (bắt buộc trong spec)

Ghi vào spec:

| Mục | Nội dung |
|---|---|
| Các bước | từ trạng thái ban đầu (dữ liệu seed, đã/chưa đăng nhập CMS, màn 360px hay desktop) tới lỗi |
| Mong đợi | hành vi đúng, trích nguồn |
| Thực tế | hành vi quan sát được, kèm thông báo lỗi/log (không chép secrets, [QD-05]) |
| Vi phạm | FR/NFR, AD hoặc `[QD-xx]` bị vi phạm |
| `[NO-xx]` | mục nợ trùng, nếu có |

1. Tái hiện trên app cục bộ (`docs/kiem-chung.md` §2). Lỗi chỉ có ở bản build (cache, prerender) → `npm run build && npm start`.
2. Không tìm được nguồn cho "mong đợi" → spec thiếu: ghi câu hỏi theo [QD-23]. BLOCKER thì dừng.
3. Không tái hiện được → ghi đã thử gì, dừng, hỏi.

## Bước 2: Tìm nguyên nhân gốc

1. Lần theo luồng: màn hình → query/action → service → DB (AD-6, AD-7, AD-12).
2. Ghi vào spec: nguyên nhân ở `file:dòng`, vì sao gây ra triệu chứng, còn chỗ nào khác cùng nguyên nhân (`grep -rn`).
3. Chỗ khác cùng nguyên nhân nằm ngoài phạm vi → liệt kê, đề xuất, không tự sửa ([QD-24]).
4. Nguyên nhân là code đúng theo code cũ nhưng sai theo spine → spine thắng; sửa theo spine trong phạm vi lỗi.

## Bước 3: Test đỏ

1. Đã có Vitest (sau epic nền) và lỗi nằm ở `platform/`, `schema.ts` hoặc `service.ts` → viết test tái hiện đặt cạnh file nguồn (`*.test.ts`, tên tiếng Việt), chạy thấy **đỏ** (AD-16).
2. Test viết theo PRD/spine, không theo hành vi hiện tại của code (AD-16).
3. Lỗi giao diện, cache trang, hoặc chưa có Vitest → ghi bước kiểm tay thay test vào spec.

## Bước 4: Sửa

1. Sửa ở chỗ nguyên nhân gốc, thay đổi nhỏ nhất làm test xanh.
2. Không đổi hành vi khác, không refactor kèm, không "dọn" code bên cạnh ([QD-24]).
3. Sửa chạm file cũ (`lib/*`, `components/site|cms/*`, `app/cms/actions.ts`) → chuyển file đó theo `docs/cong-thuc/chuyen-code-cu.md` trong cùng thay đổi (AD-17). Chuyển trước, sửa sau, để diff tách được hai việc.
4. Sửa chạm schema → `docs/cong-thuc/doi-schema.md`.
5. Ghi dữ liệu hiển thị public → kiểm lại `updateTag` đủ tag (AD-7).

## Bước 5: Ghi nợ và tài liệu

1. Lỗi trùng một `[NO-xx]` và đã sửa hết → xoá mục đó khỏi `docs/no-ky-thuat.md`, sửa tài liệu nhắc tới nó.
2. Phát hiện lỗi/nợ khác không sửa → thêm `[NO-xx]` mới (ID tiếp theo, không đánh số lại) vào `docs/no-ky-thuat.md`.
3. Lỗi làm một khẳng định trong `docs/` sai → sửa tài liệu cùng thay đổi.

## Kiểm chứng

- Test ở Bước 3 chuyển **xanh**; toàn bộ suite Vitest vẫn xanh (khi có).
- `docs/kiem-chung.md` §1 và dòng tương ứng ở §3; `npm run build` khi chạm cache, route hoặc config.
- Chạy lại đúng các bước tái hiện ở Bước 1: lỗi không còn. Ghi vào báo cáo.

## Checklist

- [ ] Spec có bảng tái hiện: các bước, mong đợi kèm nguồn, thực tế, FR/AD/QD bị vi phạm.
- [ ] Spec ghi nguyên nhân gốc ở `file:dòng`; bản sửa nằm ở đó, không che triệu chứng.
- [ ] Có test đỏ trước, xanh sau khi lỗi kiểm được bằng Vitest; test theo PRD/spine, tên tiếng Việt (AD-16).
- [ ] Diff chỉ gồm bản sửa (và việc chuyển file cũ bắt buộc); không mở rộng phạm vi ([QD-24]).
- [ ] File cũ bị chạm đã chuyển vị trí, mọi import đã sửa (AD-17).
- [ ] Spec thiếu/mâu thuẫn đã thành câu hỏi [QD-23]; không tự chọn hành vi.
- [ ] `docs/no-ky-thuat.md` đã cập nhật: xoá mục đã sửa, thêm mục mới phát hiện.
- [ ] Đã chạy lại các bước tái hiện; kết quả ghi trong báo cáo.
- [ ] Mọi mục trong **Checklist khi review** của `docs/quy-dinh.md`.
