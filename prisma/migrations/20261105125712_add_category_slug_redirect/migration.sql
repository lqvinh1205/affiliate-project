-- CreateTable
CREATE TABLE "CategorySlugRedirect" (
    "id" TEXT NOT NULL,
    "oldSlug" VARCHAR(80) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategorySlugRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategorySlugRedirect_oldSlug_key" ON "CategorySlugRedirect"("oldSlug");

-- CreateIndex
CREATE INDEX "CategorySlugRedirect_categoryId_idx" ON "CategorySlugRedirect"("categoryId");

-- AddForeignKey
ALTER TABLE "CategorySlugRedirect" ADD CONSTRAINT "CategorySlugRedirect_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
