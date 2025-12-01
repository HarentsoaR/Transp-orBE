import { prisma } from "../../config/prisma";

type BusInput = {
  plateNumber: string;
  capacity: number;
  comfortLevel?: string;
  status?: "ACTIVE" | "IN_SERVICE" | "OUT_OF_SERVICE" | "RETIRED";
};

export const BusService = {
  list() {
    return prisma.bus.findMany({ orderBy: { plateNumber: "asc" } });
  },

  create(input: BusInput) {
    return prisma.bus.create({ data: input });
  },

  update(id: string, input: Partial<BusInput>) {
    return prisma.bus.update({ where: { id }, data: input });
  },

  async remove(id: string) {
    const tripCount = await prisma.trip.count({ where: { busId: id } });
    if (tripCount > 0) {
      throw new Error("Impossible de supprimer: bus lié à des trajets");
    }
    return prisma.bus.delete({ where: { id } });
  },
};
