-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SuggestionKind" ADD VALUE 'THREADS_POST';
ALTER TYPE "SuggestionKind" ADD VALUE 'FACEBOOK_POST';
ALTER TYPE "SuggestionKind" ADD VALUE 'LINK_COMMENT';

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "contentSetId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "parts" TEXT[],
    "linkComment" VARCHAR(2000),
    "styleProfileId" TEXT,
    "firstCopiedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "postUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_contentSetId_platform_key" ON "SocialPost"("contentSetId", "platform");

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_contentSetId_fkey" FOREIGN KEY ("contentSetId") REFERENCES "ContentSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_styleProfileId_fkey" FOREIGN KEY ("styleProfileId") REFERENCES "StyleProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Viết tay (spine AD-19): Bài mạng xã hội chỉ cho Threads, Facebook; Bài web nằm ở `Post`.
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_social_platform" CHECK ("platform" IN ('THREADS', 'FACEBOOK'));
