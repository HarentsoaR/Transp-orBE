-- CreateEnum
CREATE TYPE "TravelerStatus" AS ENUM ('ACTIVE', 'BLACKLISTED', 'INACTIVE');

-- AlterTable
ALTER TABLE "Traveler"
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "docType" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "TravelerStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Driver"
ADD COLUMN     "licenseExpiry" TIMESTAMP(3),
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Bus"
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "year" INTEGER,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "odometer" INTEGER,
ADD COLUMN     "nextMaintenanceAt" TIMESTAMP(3),
ADD COLUMN     "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE INDEX "Traveler_status_idx" ON "Traveler"("status");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "Bus_status_idx" ON "Bus"("status");
