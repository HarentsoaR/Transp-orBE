import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

type BusInput = {
  plateNumber: string;
  capacity: number;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  category?: string | null;
  comfortLevel?: string;
  status?: "ACTIVE" | "IN_SERVICE" | "OUT_OF_SERVICE" | "RETIRED";
  odometer?: number | null;
  nextMaintenanceAt?: Date | null;
  insuranceExpiry?: Date | null;
  notes?: string | null;
};

type BusListInput = {
  search?: string;
  status?: string[];
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

const buildOrderBy = (sortBy: string | undefined, sortDir: "asc" | "desc"): Prisma.BusOrderByWithRelationInput => {
  switch (sortBy) {
    case "plateNumber":
      return { plateNumber: sortDir };
    case "capacity":
    case "seats":
      return { capacity: sortDir };
    case "brand":
      return { brand: sortDir };
    case "model":
      return { model: sortDir };
    case "year":
      return { year: sortDir };
    case "status":
      return { status: sortDir };
    case "nextMaintenanceAt":
      return { nextMaintenanceAt: sortDir };
    case "createdAt":
      return { createdAt: sortDir };
    case "updatedAt":
      return { updatedAt: sortDir };
    default:
      return { updatedAt: "desc" };
  }
};

export const BusService = {
  async list(input: BusListInput) {
    const where: Prisma.BusWhereInput = {};
    if (input.search) {
      const search = input.search;
      where.OR = [
        { plateNumber: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }
    if (input.status && input.status.length > 0) {
      const normalized = input.status.filter((value): value is NonNullable<BusInput["status"]> => Boolean(value));
      if (normalized.length > 0) {
        where.status = { in: normalized };
      }
    }

    const skip = (input.page - 1) * input.pageSize;
    const take = input.pageSize;
    const orderBy = buildOrderBy(input.sortBy, input.sortDir ?? "desc");

    const [items, total] = await prisma.$transaction([
      prisma.bus.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { drivers: true },
      }),
      prisma.bus.count({ where }),
    ]);

    const ids = items.map((bus) => bus.id);
    const now = new Date();
    const counts = await prisma.trip.groupBy({
      by: ["busId"],
      where: { busId: { in: ids }, departureTime: { gt: now } },
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((item) => [item.busId, item._count._all]));

    return {
      items: items.map((item) => ({ ...item, upcomingTrips: countMap.get(item.id) ?? 0 })),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
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
