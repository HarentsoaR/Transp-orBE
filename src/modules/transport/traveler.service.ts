import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

type TravelerInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  nationality?: string | null;
  docType?: string | null;
  nationalId?: string | null;
  profession?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  status?: "ACTIVE" | "BLACKLISTED" | "INACTIVE";
  tags?: string[];
};

type TravelerListInput = {
  search?: string;
  status?: string[];
  tags?: string[];
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

const buildOrderBy = (
  sortBy: string | undefined,
  sortDir: "asc" | "desc"
): Prisma.TravelerOrderByWithRelationInput => {
  switch (sortBy) {
    case "fullName":
      return { fullName: sortDir };
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

export const TravelerService = {
  async list(input: TravelerListInput) {
    const where: Prisma.TravelerWhereInput = {};
    if (input.search) {
      const search = input.search;
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { nationalId: { contains: search, mode: "insensitive" } },
      ];
    }
    if (input.status && input.status.length > 0) {
      const normalized = input.status.filter(
        (value): value is NonNullable<TravelerInput["status"]> => Boolean(value)
      );
      if (normalized.length > 0) {
        where.status = { in: normalized };
      }
    }
    if (input.tags && input.tags.length > 0) {
      where.tags = { hasSome: input.tags };
    }

    const skip = (input.page - 1) * input.pageSize;
    const take = input.pageSize;
    const orderBy = buildOrderBy(input.sortBy, input.sortDir ?? "desc");

    const [items, total] = await prisma.$transaction([
      prisma.traveler.findMany({ where, orderBy, skip, take }),
      prisma.traveler.count({ where }),
    ]);

    return { items, total, page: input.page, pageSize: input.pageSize };
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
