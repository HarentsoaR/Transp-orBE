import { prisma } from "../../config/prisma";

type DriverInput = {
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  assignedBusId?: string | null;
};

export const DriverService = {
  list() {
    return prisma.driver.findMany({ include: { assignedBus: true } });
  },

  create(input: DriverInput) {
    return prisma.driver.create({ data: input });
  },

  update(id: string, input: Partial<DriverInput>) {
    return prisma.driver.update({ where: { id }, data: input });
  },

  async remove(id: string) {
    const tripCount = await prisma.trip.count({ where: { driverId: id } });
    if (tripCount > 0) {
      throw new Error("Impossible de supprimer: conducteur lié à des trajets");
    }
    return prisma.driver.delete({ where: { id } });
  },
};
