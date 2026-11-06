-- CreateTable
CREATE TABLE "PostStat" (
    "postId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostStat_pkey" PRIMARY KEY ("postId")
);

-- CreateTable
CREATE TABLE "PostViewDaily" (
    "postId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostViewDaily_pkey" PRIMARY KEY ("postId","day")
);

-- CreateIndex
CREATE INDEX "PostStat_views_idx" ON "PostStat"("views");

-- CreateIndex
CREATE INDEX "PostViewDaily_day_idx" ON "PostViewDaily"("day");

-- AddForeignKey
ALTER TABLE "PostStat" ADD CONSTRAINT "PostStat_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostViewDaily" ADD CONSTRAINT "PostViewDaily_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
