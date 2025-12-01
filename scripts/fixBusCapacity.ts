import { ReservationStatus } from "@prisma/client";
import { prisma } from "../src/config/prisma";

async function main() {
  console.log("Updating all buses to capacity 16...");
  await prisma.bus.updateMany({ data: { capacity: 16 } });

  console.log("Recomputing trip availability based on confirmed reservations...");
  const trips = await prisma.trip.findMany({
    include: {
      reservations: { where: { status: ReservationStatus.CONFIRMED } },
    },
  });

  for (const trip of trips) {
    const reservedCount = trip.reservations.filter((r) => r.seatNumber !== null).length;
    const availableSeats = Math.max(16 - reservedCount, 0);
    await prisma.trip.update({
      where: { id: trip.id },
      data: { availableSeats },
    });
  }

  console.log(`Updated ${trips.length} trip(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
