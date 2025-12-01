-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "travelerProfession" TEXT;

-- AlterTable
ALTER TABLE "Traveler" ADD COLUMN     "profession" TEXT;

-- CreateTable
CREATE TABLE "ReservationSeat" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,

    CONSTRAINT "ReservationSeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservationSeat_tripId_seatNumber_key" ON "ReservationSeat"("tripId", "seatNumber");

-- AddForeignKey
ALTER TABLE "ReservationSeat" ADD CONSTRAINT "ReservationSeat_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSeat" ADD CONSTRAINT "ReservationSeat_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
