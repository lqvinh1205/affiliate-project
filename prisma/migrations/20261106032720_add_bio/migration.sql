-- CreateTable
CREATE TABLE "BioSettings" (
    "id" TEXT NOT NULL,
    "intro" VARCHAR(500) NOT NULL,
    "disclosure" VARCHAR(300) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BioSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BioItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "sortAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BioItem_productId_key" ON "BioItem"("productId");

-- AddForeignKey
ALTER TABLE "BioItem" ADD CONSTRAINT "BioItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
