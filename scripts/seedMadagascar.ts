import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cities = ["Antananarivo", "Antsirabe", "Antsiranana", "Toliara", "Fianarantsoa", "Toamasina", "Mahajanga"];

const sampleRoutes = [
  ["Antananarivo", "Antsirabe"],
  ["Antananarivo", "Fianarantsoa"],
  ["Antananarivo", "Toamasina"],
  ["Antananarivo", "Mahajanga"],
  ["Antsirabe", "Fianarantsoa"],
  ["Antsiranana", "Antananarivo"],
  ["Toliara", "Antananarivo"],
  ["Toamasina", "Fianarantsoa"],
  ["Mahajanga", "Antsirabe"],
  ["Antsirabe", "Toamasina"],
];

const busPlates = ["TAA 1234", "TBB 5678", "TCX 9012", "TDX 3456", "TEY 7890", "TFZ 2345", "TGV 6789"];
const driverNames = [
  ["Jean", "Rakoto"],
  ["Hery", "Randria"],
  ["Miora", "Rasoa"],
  ["Faly", "Rabez"],
  ["Tiana", "Andry"],
  ["Lova", "Rakotoniaina"],
  ["Fanja", "Raharimalala"],
];

async function main() {
  console.log("Truncating data (reservations, trips, routes, drivers, buses, travelers)...");
  await prisma.reservationSeat.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.route.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.traveler.deleteMany();

  console.log("Seeding buses...");
  const buses = await Promise.all(
    busPlates.map((plate) =>
      prisma.bus.create({
        data: {
          plateNumber: plate,
          capacity: 16,
          comfortLevel: "Premium",
          status: "ACTIVE",
        },
      })
    )
  );

  console.log("Seeding drivers...");
  const drivers = await Promise.all(
    driverNames.map(([firstName, lastName]) =>
      prisma.driver.create({
        data: {
          firstName,
          lastName,
          phone: `+2613${Math.floor(Math.random() * 10000000)
            .toString()
            .padStart(7, "0")}`,
          licenseNumber: `LIC-${Math.floor(Math.random() * 90000) + 10000}`,
          status: "ACTIVE",
        },
      })
    )
  );

  console.log("Seeding routes...");
  const routes = await Promise.all(
    sampleRoutes.map(([origin, destination]) =>
      prisma.route.create({
        data: {
          origin,
          destination,
          distanceKm: Math.floor(Math.random() * 300) + 150,
          standardDurationMinutes: Math.floor(Math.random() * 180) + 180,
          basePrice: 30000,
        },
      })
    )
  );

  console.log("Seeding trips...");
  const trips = [];
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    const route = routes[i % routes.length];
    const bus = buses[i % buses.length];
    const driver = drivers[i % drivers.length];
    const departureTime = new Date(now);
    departureTime.setDate(now.getDate() + i);
    departureTime.setHours(8 + (i % 3) * 3, 0, 0, 0);

    const trip = await prisma.trip.create({
      data: {
        routeId: route.id,
        busId: bus.id,
        driverId: driver.id,
        departureTime,
        price: 35000,
        status: "SCHEDULED",
        availableSeats: 16,
      },
    });
    trips.push(trip);
  }

  console.log(`Seeded ${buses.length} buses, ${drivers.length} drivers, ${routes.length} routes, ${trips.length} trips.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
