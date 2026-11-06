-- Tìm kiếm không dấu (FR-36): backfill lại `Post.searchText`, bỏ thực thể HTML (`&amp;`, `&quot;`, `&#39;`…) trong thân
-- bài trước khi gấp — không để "amp", "quot", "lt", "gt" thành từ tìm được. Cùng luật với `postSearchText`
-- (platform/search-text.ts). Không đổi cấu trúc bảng.
UPDATE "Post"
SET "searchText" = btrim(regexp_replace(
  lower(translate(
    concat_ws(' ', "title", "excerpt", array_to_string("tags", ' '),
      regexp_replace(regexp_replace("content", '<[^>]+>', ' ', 'g'), '&[a-zA-Z0-9#]+;', ' ', 'g')),
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydaaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
  )),
  '[^a-z0-9]+', ' ', 'g'
));
