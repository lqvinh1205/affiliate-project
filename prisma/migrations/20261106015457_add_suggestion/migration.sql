-- CreateEnum
CREATE TYPE "SuggestionKind" AS ENUM ('RESEARCH', 'PRODUCT_CATEGORY');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('GENERATING', 'PENDING', 'APPROVED', 'REJECTED', 'FAILED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "kind" "SuggestionKind" NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'GENERATING',
    "payload" JSONB,
    "riskWarnings" JSONB NOT NULL DEFAULT '[]',
    "errorMessage" VARCHAR(300),
    "promptId" VARCHAR(100) NOT NULL,
    "promptVersion" INTEGER NOT NULL,
    "editedBeforeApproval" BOOLEAN NOT NULL DEFAULT false,
    "parentSuggestionId" TEXT,
    "sources" JSONB,
    "skipped" JSONB,
    "firstCopiedAt" TIMESTAMP(3),
    "productId" TEXT,
    "contentSetId" TEXT,
    "inspirationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Suggestion_productId_kind_createdAt_idx" ON "Suggestion"("productId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "Suggestion_parentSuggestionId_idx" ON "Suggestion"("parentSuggestionId");

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_parentSuggestionId_fkey" FOREIGN KEY ("parentSuggestionId") REFERENCES "Suggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Viết tay (spine AD-9, AD-15): mỗi Gợi ý gắn đúng một đích — Sản phẩm, Bộ nội dung hoặc Cảm hứng.
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_one_target" CHECK (
  num_nonnulls("productId", "contentSetId", "inspirationId") = 1
);

-- Viết tay (spine AD-18, AD-19): mỗi khoá đích (`kind` + Sản phẩm) tối đa một gợi ý đang tạo hoặc đang chờ duyệt.
-- Tạo lại chuyển bản cũ sang SUPERSEDED/FAILED trong cùng transaction trước khi chèn bản mới.
CREATE UNIQUE INDEX "Suggestion_active_product_key" ON "Suggestion"("kind", "productId")
  WHERE "status" IN ('GENERATING', 'PENDING') AND "productId" IS NOT NULL;
