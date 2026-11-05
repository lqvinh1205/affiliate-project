-- CreateTable
CREATE TABLE "PostSlugRedirect" (
    "id" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostSlugRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostSlugRedirect_oldSlug_key" ON "PostSlugRedirect"("oldSlug");

-- CreateIndex
CREATE INDEX "PostSlugRedirect_postId_idx" ON "PostSlugRedirect"("postId");

-- AddForeignKey
ALTER TABLE "PostSlugRedirect" ADD CONSTRAINT "PostSlugRedirect_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
