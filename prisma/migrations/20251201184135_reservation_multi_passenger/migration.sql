-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "passengerName" TEXT,
ADD COLUMN     "passengerNationalId" TEXT,
ADD COLUMN     "passengerPhone" TEXT;

-- AlterTable
ALTER TABLE "Traveler" ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "nationalId" TEXT;
