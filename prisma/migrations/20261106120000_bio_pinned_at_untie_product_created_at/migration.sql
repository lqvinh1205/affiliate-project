-- Trang bio: khoá thứ tự nhóm "Đang ghim" tách khỏi `sortAt` để bỏ ghim về đúng chỗ cũ (review gộp Epic 6).
ALTER TABLE "BioItem" ADD COLUMN "pinnedAt" TIMESTAMP(3);

-- Món đang ghim: khoá cũ (`sortAt`) chuyển sang `pinnedAt`; `sortAt` về null (chưa sắp tay ở nhóm còn lại).
UPDATE "BioItem" SET "pinnedAt" = COALESCE("sortAt", "updatedAt"), "sortAt" = NULL WHERE "pinned";

-- Sản phẩm có sẵn khi thêm cột `createdAt` (migration add_product_price_and_raw_data) trùng một giá trị: lùi mỗi món
-- 1 ms theo `id` tăng dần — giữ thứ tự Trang bio hiện tại (khoá giảm dần, hoà xếp `id` tăng dần) và để lên/xuống chỉ
-- ghi hai món thay vì cả nhóm trùng.
UPDATE "Product" AS p
SET "createdAt" = p."createdAt" - (t.rn - 1) * INTERVAL '1 millisecond'
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "createdAt" ORDER BY "id") AS rn FROM "Product"
) AS t
WHERE p."id" = t."id" AND t.rn > 1;
