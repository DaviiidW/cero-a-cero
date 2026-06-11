-- CreateTable
CREATE TABLE "GroupRanking" (
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "matchPoints" INTEGER NOT NULL,
    "bonusPoints" INTEGER NOT NULL,
    "championPoints" INTEGER NOT NULL,
    "runnerUpPoints" INTEGER NOT NULL,
    "thirdPlacePoints" INTEGER NOT NULL,
    "worstTeamPoints" INTEGER NOT NULL,
    "exactCount" INTEGER NOT NULL,
    "championCorrect" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupRanking_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateTable
CREATE TABLE "GlobalRanking" (
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "matchPoints" INTEGER NOT NULL,
    "bonusPoints" INTEGER NOT NULL,
    "exactCount" INTEGER NOT NULL,
    "correctChampionGroups" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalRanking_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "GroupRanking_groupId_position_idx" ON "GroupRanking"("groupId", "position");

-- CreateIndex
CREATE INDEX "GlobalRanking_position_idx" ON "GlobalRanking"("position");

-- AddForeignKey
ALTER TABLE "GroupRanking" ADD CONSTRAINT "GroupRanking_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRanking" ADD CONSTRAINT "GroupRanking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalRanking" ADD CONSTRAINT "GlobalRanking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
