import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissionCodes = [
  "transport.buses.view",
  "transport.buses.create",
  "transport.buses.update",
  "transport.buses.delete",
  "transport.drivers.view",
  "transport.drivers.create",
  "transport.drivers.update",
  "transport.drivers.delete",
  "transport.routes.view",
  "transport.routes.create",
  "transport.routes.update",
  "transport.routes.delete",
  "transport.trips.view",
  "transport.trips.create",
  "transport.trips.update",
  "transport.trips.delete",
  "transport.reservations.manage",
  "driver.operations",
  "search.manage",
];

const profiles = [
  {
    name: "RESPONSABLE_RESERVATION",
    description: "Gère les réservations (backoffice) et le suivi des trajets",
    permissions: ["transport.reservations.manage", "transport.trips.view", "transport.routes.view"],
    user: {
      email: "resa@transport.local",
      firstName: "Resa",
      lastName: "Manager",
      password: "Resa123!",
    },
  },
  {
    name: "RESPONSABLE_TRAJET",
    description: "Planification des trajets, affectation bus/chauffeur",
    permissions: [
      "transport.trips.view",
      "transport.trips.create",
      "transport.trips.update",
      "transport.trips.delete",
      "transport.routes.view",
      "transport.routes.create",
      "transport.routes.update",
      "transport.routes.delete",
      "transport.drivers.view",
      "transport.buses.view",
    ],
    user: {
      email: "trajet@transport.local",
      firstName: "Trajet",
      lastName: "Manager",
      password: "Trajet123!",
    },
  },
  {
    name: "RESPONSABLE_LOGISTIQUE",
    description: "Gestion flotte et chauffeurs",
    permissions: [
      "transport.buses.view",
      "transport.buses.create",
      "transport.buses.update",
      "transport.buses.delete",
      "transport.drivers.view",
      "transport.drivers.create",
      "transport.drivers.update",
      "transport.drivers.delete",
    ],
    user: {
      email: "logistique@transport.local",
      firstName: "Logistique",
      lastName: "Manager",
      password: "Log123!",
    },
  },
];

async function main() {
  // Ensure permissions exist
  const perms = await Promise.all(
    permissionCodes.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: code },
      })
    )
  );
  const permMap = new Map(perms.map((p) => [p.code, p.id]));

  for (const profile of profiles) {
    const createdProfile = await prisma.profile.upsert({
      where: { name: profile.name },
      update: { description: profile.description },
      create: { name: profile.name, description: profile.description },
    });

    await prisma.profilePermission.deleteMany({ where: { profileId: createdProfile.id } });
    await prisma.profilePermission.createMany({
      data: profile.permissions
        .map((code) => permMap.get(code))
        .filter(Boolean)
        .map((permissionId) => ({
          profileId: createdProfile.id,
          permissionId: permissionId as string,
        })),
    });

    const existingUser = await prisma.user.findUnique({ where: { email: profile.user.email } });
    if (!existingUser) {
      const passwordHash = await bcrypt.hash(profile.user.password, 10);
      await prisma.user.create({
        data: {
          email: profile.user.email,
          passwordHash,
          firstName: profile.user.firstName,
          lastName: profile.user.lastName,
          profileId: createdProfile.id,
        },
      });
      console.log(`User created: ${profile.user.email} / ${profile.user.password}`);
    } else {
      console.log(`User exists: ${profile.user.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
