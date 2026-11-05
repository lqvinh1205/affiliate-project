-- Viết tay (Story 1.4): giữ dữ liệu bài và Sản phẩm, không xoá/tạo lại cột hay enum.

-- Enum "Category" thực chất là Loại bài: đổi tên kiểu và cột TRƯỚC khi tạo bảng "Category"
-- (Postgres tạo kiểu hàng trùng tên với bảng nên tên "Category" phải được giải phóng).
ALTER TYPE "Category" RENAME TO "PostType";
ALTER TABLE "Post" RENAME COLUMN "category" TO "postType";
ALTER INDEX "Post_status_category_publishedAt_idx" RENAME TO "Post_status_postType_publishedAt_idx";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "Post_categoryId_idx" ON "Post"("categoryId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateTable
CREATE TABLE "PostProduct" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "PostProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostProduct_productId_idx" ON "PostProduct"("productId");
CREATE UNIQUE INDEX "PostProduct_postId_productId_key" ON "PostProduct"("postId", "productId");

-- Chép quan hệ Bài web – Sản phẩm cũ sang bảng nối, giữ thứ tự.
INSERT INTO "PostProduct" ("id", "postId", "productId", "sortOrder")
SELECT gen_random_uuid(), "postId", "id", "sortOrder" FROM "Product";

-- Bỏ liên kết cứng Sản phẩm → bài.
ALTER TABLE "Product" DROP CONSTRAINT "Product_postId_fkey";
DROP INDEX "Product_postId_idx";
ALTER TABLE "Product" DROP COLUMN "postId",
DROP COLUMN "sortOrder";

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PostProduct" ADD CONSTRAINT "PostProduct_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostProduct" ADD CONSTRAINT "PostProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
