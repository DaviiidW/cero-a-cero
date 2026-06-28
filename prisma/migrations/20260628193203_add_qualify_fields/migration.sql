-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "qualifyingTeam" TEXT;

-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "predictionQualify" TEXT;

-- AlterTable
ALTER TABLE "PredictionHistory" ADD COLUMN     "predictionQualify" TEXT;
