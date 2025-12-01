import { prisma } from "../../config/prisma";

type TravelerInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  nationalId?: string | null;
  profession?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

export const TravelerService = {
  list() {
    return prisma.traveler.findMany({ orderBy: { fullName: "asc" } });
  },

  create(input: TravelerInput) {
    return prisma.traveler.create({ data: input });
  },

  update(id: string, input: Partial<TravelerInput>) {
    return prisma.traveler.update({ where: { id }, data: input });
  },

  async remove(id: string) {
    const resCount = await prisma.reservation.count({ where: { travelerId: id } });
    if (resCount > 0) {
      throw new Error("Impossible de supprimer: voyageur lié à des réservations");
    }
    return prisma.traveler.delete({ where: { id } });
  },
};
