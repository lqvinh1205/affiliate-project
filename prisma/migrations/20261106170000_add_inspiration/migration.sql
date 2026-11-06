-- CreateEnum
CREATE TYPE "InspirationStatus" AS ENUM ('NEW', 'SKIPPED');

-- AlterTable
ALTER TABLE "ContentSet" ADD COLUMN     "inspirationId" TEXT;

-- AlterTable
ALTER TABLE "ResearchProfile" ADD COLUMN     "inspirationId" TEXT;

-- CreateTable
CREATE TABLE "Inspiration" (
    "id" TEXT NOT NULL,
    "url" VARCHAR(2000),
    "mediaUrl" VARCHAR(200),
    "note" VARCHAR(500),
    "status" "InspirationStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspiration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inspiration_status_createdAt_idx" ON "Inspiration"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentSet_inspirationId_idx" ON "ContentSet"("inspirationId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProfile_inspirationId_key" ON "ResearchProfile"("inspirationId");

-- CreateIndex
CREATE INDEX "Suggestion_inspirationId_kind_createdAt_idx" ON "Suggestion"("inspirationId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "ContentSet" ADD CONSTRAINT "ContentSet_inspirationId_fkey" FOREIGN KEY ("inspirationId") REFERENCES "Inspiration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProfile" ADD CONSTRAINT "ResearchProfile_inspirationId_fkey" FOREIGN KEY ("inspirationId") REFERENCES "Inspiration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_inspirationId_fkey" FOREIGN KEY ("inspirationId") REFERENCES "Inspiration"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Viết tay (spine AD-15, FR-1): Cảm hứng có ít nhất một nguồn — link dán vào hoặc file tải lên.
ALTER TABLE "Inspiration" ADD CONSTRAINT "Inspiration_has_source" CHECK (
  num_nonnulls("url", "mediaUrl") >= 1
);

-- Viết tay (spine AD-19): Hồ sơ nghiên cứu thuộc đúng một đích — Sản phẩm hoặc Cảm hứng.
ALTER TABLE "ResearchProfile" ADD CONSTRAINT "ResearchProfile_one_target" CHECK (
  num_nonnulls("productId", "inspirationId") = 1
);

-- Viết tay (spine AD-18, AD-19): mỗi khoá đích (`kind` + Cảm hứng) tối đa một gợi ý đang tạo hoặc đang chờ duyệt.
CREATE UNIQUE INDEX "Suggestion_active_inspiration_key" ON "Suggestion"("kind", "inspirationId")
  WHERE "status" IN ('GENERATING', 'PENDING') AND "inspirationId" IS NOT NULL;
