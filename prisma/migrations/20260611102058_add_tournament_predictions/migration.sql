-- CreateTable
CREATE TABLE "TournamentPrediction" (
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "champion" TEXT,
    "runnerUp" TEXT,
    "thirdPlace" TEXT,
    "worstTeam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentPrediction_pkey" PRIMARY KEY ("userId","groupId")
);

-- CreateTable
CREATE TABLE "TournamentResult" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "champion" TEXT,
    "runnerUp" TEXT,
    "thirdPlace" TEXT,

    CONSTRAINT "TournamentResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TournamentPrediction" ADD CONSTRAINT "TournamentPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPrediction" ADD CONSTRAINT "TournamentPrediction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
