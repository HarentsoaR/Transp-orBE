import { prisma } from "../../config/prisma";

type RouteInput = {
  origin: string;
  destination: string;
  distanceKm?: number;
  standardDurationMinutes?: number;
  basePrice: number;
  isActive?: boolean;
};

export const RouteService = {
  list() {
    return prisma.route.findMany({ orderBy: [{ origin: "asc" }, { destination: "asc" }] });
  },

  get(id: string) {
    return prisma.route.findUnique({ where: { id } });
  },

  create(input: RouteInput) {
    return prisma.route.create({ data: input });
  },

  update(id: string, input: Partial<RouteInput>) {
    return prisma.route.update({ where: { id }, data: input });
  },

  async remove(id: string) {
    const tripCount = await prisma.trip.count({ where: { routeId: id } });
    if (tripCount > 0) {
      throw new Error("Impossible de supprimer: route liée à des trajets");
    }
    return prisma.route.delete({ where: { id } });
  },
};
