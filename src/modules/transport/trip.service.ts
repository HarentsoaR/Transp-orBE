import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

type TripInput = {
  routeId: string;
  busId: string;
  driverId: string;
  departureTime: Date;
  arrivalTime?: Date | null;
  price: number;
  status?: "SCHEDULED" | "BOARDING" | "DEPARTED" | "ARRIVED" | "CANCELLED";
  availableSeats?: number;
  notes?: string | null;
};

type TripSearchInput = {
  origin?: string;
  destination?: string;
  date?: string;
};

export const TripService = {
  getById(id: string) {
    return prisma.trip.findUnique({
      where: { id },
      include: { route: true, bus: true, driver: true },
    });
  },

  async search(input: TripSearchInput) {
    const where: Prisma.TripWhereInput = {};
    if (input.origin || input.destination) {
      const routeFilter: Prisma.RouteWhereInput = {};
      if (input.origin) routeFilter.origin = { equals: input.origin, mode: "insensitive" };
      if (input.destination) routeFilter.destination = { equals: input.destination, mode: "insensitive" };
      where.route = { is: routeFilter };
    }
    if (input.date) {
      const day = new Date(input.date);
      const start = new Date(day);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setUTCHours(23, 59, 59, 999);
      where.departureTime = { gte: start, lte: end };
    }

    return prisma.trip.findMany({
      where,
      include: { route: true, bus: true, driver: true },
      orderBy: { departureTime: "asc" },
    });
  },

  async create(input: TripInput) {
    const bus = await prisma.bus.findUnique({ where: { id: input.busId } });
    if (!bus) throw new Error("Bus not found");

    const availableSeats = input.availableSeats ?? bus.capacity;

    return prisma.trip.create({
      data: { ...input, availableSeats },
      include: { route: true, bus: true, driver: true },
    });
  },

  update(id: string, input: Partial<TripInput>) {
    return prisma.trip.update({ where: { id }, data: input });
  },

  updateStatus(id: string, status: TripInput["status"]) {
    return prisma.trip.update({ where: { id }, data: { status } });
  },

  async remove(id: string) {
    await prisma.reservationSeat.deleteMany({ where: { tripId: id } });
    await prisma.reservation.deleteMany({ where: { tripId: id } });
    return prisma.trip.delete({ where: { id } });
  },

  listByDriver(driverId: string) {
    return prisma.trip.findMany({
      where: { driverId },
      include: { route: true, bus: true },
      orderBy: { departureTime: "asc" },
    });
  },

  async seats(tripId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { bus: true },
    });
    if (!trip) throw new Error("Trip not found");

    const seatRows = await prisma.reservationSeat.findMany({
      where: { tripId, reservation: { status: "CONFIRMED" } },
      select: { seatNumber: true },
    });

    const occupied = new Set(seatRows.map((s) => s.seatNumber));
    const seats: { seatNumber: number; status: string }[] = [];
    for (let i = 1; i <= trip.bus.capacity; i++) {
      seats.push({ seatNumber: i, status: occupied.has(i) ? "OCCUPIED" : "AVAILABLE" });
    }
    return seats;
  },
};
