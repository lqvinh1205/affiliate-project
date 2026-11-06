-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "description" VARCHAR(160),
    "image" TEXT NOT NULL,
    "linkUrl" VARCHAR(500) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- Viết tay (AD-15): có cả hai mốc lịch thì giờ kết thúc phải sau giờ bắt đầu (cùng luật với `bannerInputSchema`).
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_schedule_check"
  CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" > "startsAt");
