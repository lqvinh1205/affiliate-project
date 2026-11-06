-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('WEBSITE', 'THREADS', 'FACEBOOK');

-- CreateTable
CREATE TABLE "StyleProfile" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "voice" VARCHAR(1000) NOT NULL,
    "lengthMin" INTEGER NOT NULL,
    "lengthMax" INTEGER NOT NULL,
    "partsMin" INTEGER,
    "partsMax" INTEGER,
    "emoji" VARCHAR(300) NOT NULL,
    "forbidden" VARCHAR(1000) NOT NULL,
    "rules" VARCHAR(1000) NOT NULL,
    "disclosure" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StyleProfile_platform_key" ON "StyleProfile"("platform");
