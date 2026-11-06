-- AlterEnum
ALTER TYPE "SuggestionKind" ADD VALUE 'WEB_POST';

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "platform" "Platform";

-- CreateTable
CREATE TABLE "ContentSet" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "angleId" VARCHAR(40),
    "angleName" VARCHAR(120),
    "angleHook" VARCHAR(500),
    "angleEdit" VARCHAR(500),
    "audienceId" VARCHAR(40),
    "audienceName" VARCHAR(120),
    "audienceReason" VARCHAR(500),
    "audienceEdit" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSetProduct" (
    "id" TEXT NOT NULL,
    "contentSetId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ContentSetProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentSet_postId_key" ON "ContentSet"("postId");

-- CreateIndex
CREATE INDEX "ContentSetProduct_productId_idx" ON "ContentSetProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSetProduct_contentSetId_productId_key" ON "ContentSetProduct"("contentSetId", "productId");

-- CreateIndex
CREATE INDEX "Suggestion_contentSetId_kind_createdAt_idx" ON "Suggestion"("contentSetId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "ContentSet" ADD CONSTRAINT "ContentSet_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSetProduct" ADD CONSTRAINT "ContentSetProduct_contentSetId_fkey" FOREIGN KEY ("contentSetId") REFERENCES "ContentSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSetProduct" ADD CONSTRAINT "ContentSetProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_contentSetId_fkey" FOREIGN KEY ("contentSetId") REFERENCES "ContentSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Viết tay (spine AD-19): gợi ý của Bộ nội dung luôn có nền tảng — khoá đích là `contentSetId` + `platform`.
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_content_set_platform" CHECK (
  "contentSetId" IS NULL OR "platform" IS NOT NULL
);

-- Viết tay (spine AD-18, AD-19): mỗi khoá đích của Bộ nội dung (`kind` + bộ + nền tảng) tối đa một gợi ý đang tạo
-- hoặc đang chờ duyệt. Tạo lại chuyển bản cũ sang SUPERSEDED trong cùng transaction trước khi chèn bản mới.
CREATE UNIQUE INDEX "Suggestion_active_content_set_key" ON "Suggestion"("kind", "contentSetId", "platform")
  WHERE "status" IN ('GENERATING', 'PENDING') AND "contentSetId" IS NOT NULL;
