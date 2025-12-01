import { ReservationStatus } from "@prisma/client";
import { prisma } from "../src/config/prisma";

async function main() {
  console.log("Backfilling ReservationSeat entries from existing reservations...");

  const reservations = await prisma.reservation.findMany({
    where: { status: ReservationStatus.CONFIRMED, seatNumber: { not: null } },
    select: { id: true, tripId: true, seatNumber: true },
  });

  let created = 0;
  for (const res of reservations) {
    if (!res.seatNumber) continue;
    await prisma.reservationSeat.upsert({
      where: { tripId_seatNumber: { tripId: res.tripId, seatNumber: res.seatNumber } },
      update: { reservationId: res.id },
      create: { reservationId: res.id, tripId: res.tripId, seatNumber: res.seatNumber },
    });
    created++;
  }

  console.log(`Backfill complete. Ensured ${created} seat record(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
