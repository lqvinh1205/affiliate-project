-- Tìm kiếm không dấu (FR-36, Story 8.3): cột `Post.searchText` do `posts/service.ts` ghi ở mọi lần ghi bài.
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '';

-- Backfill bài cũ: cùng luật với `toSearchText` (platform/search-text.ts) cho chữ tiếng Việt — tiêu đề, tóm tắt, thẻ,
-- chữ thân bài (bỏ thẻ HTML, &nbsp;), bỏ dấu, đ → d, chữ thường, ký tự không phải a-z/0-9 thành một khoảng trắng.
-- Bài lưu lại sau này được `posts/service.ts` ghi lại bằng `toSearchText`.
UPDATE "Post"
SET "searchText" = btrim(regexp_replace(
  lower(translate(
    concat_ws(' ', "title", "excerpt", array_to_string("tags", ' '),
      regexp_replace(replace("content", '&nbsp;', ' '), '<[^>]+>', ' ', 'g')),
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydaaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
  )),
  '[^a-z0-9]+', ' ', 'g'
));
