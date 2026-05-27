-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('OUTDATED_WEBSITE', 'NO_WEBSITE');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "existingSiteAnalysisJson" JSONB,
ADD COLUMN     "leadType" "LeadType" NOT NULL DEFAULT 'OUTDATED_WEBSITE',
ADD COLUMN     "photosJson" JSONB,
ADD COLUMN     "reviewsJson" JSONB;
