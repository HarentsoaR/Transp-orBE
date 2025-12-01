import bcrypt from "bcryptjs";
import { PrismaClient, Permission } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  "transport.buses.manage",
  "transport.drivers.manage",
  "transport.routes.manage",
  "transport.trips.manage",
  "transport.reservations.manage",
  "driver.operations",
  "search.manage",
];

const adminProfileName = "ADMIN";
const adminEmail = "admin@transport.local";
const adminPassword = "Admin123!";

async function main() {
  // Create permissions
  const createdPerms: Permission[] = [];
  for (const code of permissions) {
    const perm = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: code },
    });
    createdPerms.push(perm);
  }

  // Create admin profile with all permissions
  const adminProfile = await prisma.profile.upsert({
    where: { name: adminProfileName },
    update: {},
    create: { name: adminProfileName, description: "Super admin profile" },
  });

  await prisma.profilePermission.deleteMany({ where: { profileId: adminProfile.id } });
  await prisma.profilePermission.createMany({
    data: createdPerms.map((perm) => ({ profileId: adminProfile.id, permissionId: perm.id })),
    skipDuplicates: true,
  });

  // Create admin user
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: "Admin",
        lastName: "User",
        profileId: adminProfile.id,
      },
    });
    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Seed minimal data for quick UI testing
  const buses = await Promise.all(
    ["1234 TAF", "5678 TAA", "9999 VIP"].map((plate, idx) =>
      prisma.bus.upsert({
        where: { plateNumber: plate },
        update: {},
        create: { plateNumber: plate, capacity: 16, comfortLevel: idx === 2 ? "VIP" : "Standard" },
      })
    )
  );

  const drivers = await Promise.all(
    [
      { firstName: "Jean", lastName: "Rakoto", phone: "0340000000", licenseNumber: "LIC-0001" },
      { firstName: "Lala", lastName: "Rasoa", phone: "0341111111", licenseNumber: "LIC-0002" },
      { firstName: "Tovo", lastName: "Andry", phone: "0342222222", licenseNumber: "LIC-0003" },
    ].map((d) =>
      prisma.driver.create({ data: d }).catch(async () => {
        const existing = await prisma.driver.findFirst({ where: { licenseNumber: d.licenseNumber } });
        return existing!;
      })
    )
  );

  const routesData = [
    { origin: "Antananarivo", destination: "Tamatave", basePrice: 30000, distanceKm: 350, standardDurationMinutes: 480 },
    { origin: "Antananarivo", destination: "Fianarantsoa", basePrice: 45000, distanceKm: 410, standardDurationMinutes: 540 },
    { origin: "Antananarivo", destination: "Majunga", basePrice: 60000, distanceKm: 560, standardDurationMinutes: 720 },
    { origin: "Antananarivo", destination: "Antsirabe", basePrice: 20000, distanceKm: 170, standardDurationMinutes: 180 },
  ];

  const routes = await Promise.all(
    routesData.map((r, idx) =>
      prisma.route.upsert({
        where: { id: `seed-route-${idx}` },
        update: r,
        create: { id: `seed-route-${idx}`, ...r },
      })
    )
  );

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const tripsToCreate = [
    { route: routes[0], bus: buses[0], driver: drivers[0], departureTime: tomorrow, price: 35000 },
    { route: routes[1], bus: buses[1], driver: drivers[1], departureTime: dayAfter, price: 48000 },
    { route: routes[2], bus: buses[2], driver: drivers[2], departureTime: tomorrow, price: 62000 },
    { route: routes[3], bus: buses[2], driver: drivers[1], departureTime: dayAfter, price: 22000 },
  ];

  for (const t of tripsToCreate) {
    await prisma.trip.create({
      data: {
        routeId: t.route.id,
        busId: t.bus.id,
        driverId: t.driver.id,
        departureTime: t.departureTime,
        price: t.price,
        availableSeats: t.bus.capacity,
      },
    }).catch(() => null);
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
