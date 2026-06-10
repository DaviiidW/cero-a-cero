-- AlterTable
ALTER TABLE "Match" ADD COLUMN "externalId" INTEGER;

-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN "pointsEarned" INTEGER,
ADD COLUMN "scoredAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Match_externalId_key" ON "Match"("externalId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_date_idx" ON "Match"("date");
