-- Story 2.3: giá tham khảo có ngày, Dữ liệu thô, mốc thời gian cho Kho Sản phẩm.
-- Viết tay từ `prisma migrate diff`: đổi tên `price` → `priceText` (không DROP/ADD) để giữ giá cũ.

-- Giá: đổi tên cột, giới hạn độ dài, ngày cập nhật = lúc áp cho giá đã có.
ALTER TABLE "Product" RENAME COLUMN "price" TO "priceText";
ALTER TABLE "Product" ALTER COLUMN "priceText" SET DATA TYPE VARCHAR(50);
ALTER TABLE "Product" ADD COLUMN "priceUpdatedAt" TIMESTAMP(3);
UPDATE "Product" SET "priceUpdatedAt" = CURRENT_TIMESTAMP WHERE "priceText" IS NOT NULL;

-- Tên: giới hạn theo PRODUCT_NAME_MAX.
ALTER TABLE "Product" ALTER COLUMN "name" SET DATA TYPE VARCHAR(200);

-- Dữ liệu thô.
ALTER TABLE "Product" ADD COLUMN "rawText" TEXT,
ADD COLUMN "rawReviews" TEXT,
ADD COLUMN "rawImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Mốc thời gian: Sản phẩm có sẵn lấy lúc áp; `updatedAt` không giữ default (Prisma tự đặt khi ghi).
ALTER TABLE "Product" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Product" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
