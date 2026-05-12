import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

type DriverInput = {
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: Date | null;
  rating?: number | null;
  notes?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  assignedBusId?: string | null;
};

type DriverListInput = {
  search?: string;
  status?: string[];
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

const buildOrderBy = (sortBy: string | undefined, sortDir: "asc" | "desc"): Prisma.DriverOrderByWithRelationInput => {
  switch (sortBy) {
    case "fullName":
      return { lastName: sortDir };
    case "firstName":
      return { firstName: sortDir };
    case "lastName":
      return { lastName: sortDir };
    case "licenseExpiry":
      return { licenseExpiry: sortDir };
    case "status":
      return { status: sortDir };
    case "createdAt":
      return { createdAt: sortDir };
    case "updatedAt":
      return { updatedAt: sortDir };
    default:
      return { updatedAt: "desc" };
  }
};

export const DriverService = {
  async list(input: DriverListInput) {
    const where: Prisma.DriverWhereInput = {};
    if (input.search) {
      const search = input.search;
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (input.status && input.status.length > 0) {
      const normalized = input.status.filter(
        (value): value is NonNullable<DriverInput["status"]> => Boolean(value)
      );
      if (normalized.length > 0) {
        where.status = { in: normalized };
      }
    }

    const skip = (input.page - 1) * input.pageSize;
    const take = input.pageSize;
    const orderBy = buildOrderBy(input.sortBy, input.sortDir ?? "desc");

    const [items, total] = await prisma.$transaction([
      prisma.driver.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { assignedBus: true },
      }),
      prisma.driver.count({ where }),
    ]);

    const ids = items.map((driver) => driver.id);
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const counts = await prisma.trip.groupBy({
      by: ["driverId"],
      where: { driverId: { in: ids }, departureTime: { gte: start, lte: end } },
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((item) => [item.driverId, item._count._all]));

    return {
      items: items.map((item) => ({ ...item, todayTrips: countMap.get(item.id) ?? 0 })),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
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
