- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: Nhánh AI của createPost (NO-06) chưa có test; viết khi chuyển action sang modules/suggestions.
  evidence: Xoá khối postInputSchema.safeParse trong app/cms/actions.ts thì 46 test vẫn xanh.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: Chưa có test cho productInputSchema/postInputSchema ghép (affiliateUrl Shopee, ảnh //host).
  evidence: Không test nào import lib/post-input; viết khi chuyển schema sang modules/posts, modules/products.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: setPostStatus chưa có test tích hợp cho "Không tìm thấy bài viết" và "chưa có nội dung".
  evidence: Cần DB test (AD-16); hiện chưa có khung test tích hợp.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: withHeadingIds sinh id trùng với dãy heading "X", "X 3", "X".
  evidence: Hậu tố dùng headings.length + 1, có thể trùng slug của heading khác; code có từ trước.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: AGENTS.md và docs (quy-uoc-code, kien-truc-codebase, nen-tang-ky-thuat/*) còn trỏ lib/* đã xoá.
  evidence: AGENTS.md dòng nói lib/auth.ts, lib/sanitize.ts, lib/images.ts; làm ở Story 1.5 qua bmad-project-context.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: app/cms/page.tsx, app/cms/posts/[id]/page.tsx, app/cms/actions.ts import thẳng platform/db, trái AD-2.
  evidence: Có từ trước (lib/db); sửa khi tách sang modules/posts/cms-queries.ts, đưa vào ignores ở Story 1.3.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-dung-platform-va-vitest.md`
  summary: platform/ còn thiếu RESERVED_ROOT_SLUGS (AD-20), requiredText và slugField (AD-14).
  evidence: Spec 1.2 cấm thêm hàm chưa ai dùng; thêm ở story Danh mục và story tách schema.
