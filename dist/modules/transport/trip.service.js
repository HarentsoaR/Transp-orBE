"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripService = void 0;
const prisma_1 = require("../../config/prisma");
exports.TripService = {
    getById(id) {
        return prisma_1.prisma.trip.findUnique({
            where: { id },
            include: { route: true, bus: true, driver: true },
        });
    },
    async search(input) {
        const where = {};
        if (input.origin || input.destination) {
            const routeFilter = {};
            if (input.origin)
                routeFilter.origin = { equals: input.origin, mode: "insensitive" };
            if (input.destination)
                routeFilter.destination = { equals: input.destination, mode: "insensitive" };
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
        return prisma_1.prisma.trip.findMany({
            where,
            include: { route: true, bus: true, driver: true },
            orderBy: { departureTime: "asc" },
        });
    },
    async create(input) {
        const bus = await prisma_1.prisma.bus.findUnique({ where: { id: input.busId } });
        if (!bus)
            throw new Error("Bus not found");
        const availableSeats = input.availableSeats ?? bus.capacity;
        return prisma_1.prisma.trip.create({
            data: { ...input, availableSeats },
            include: { route: true, bus: true, driver: true },
        });
    },
    update(id, input) {
        return prisma_1.prisma.trip.update({ where: { id }, data: input });
    },
    updateStatus(id, status) {
        return prisma_1.prisma.trip.update({ where: { id }, data: { status } });
    },
    async remove(id) {
        await prisma_1.prisma.reservationSeat.deleteMany({ where: { tripId: id } });
        await prisma_1.prisma.reservation.deleteMany({ where: { tripId: id } });
        return prisma_1.prisma.trip.delete({ where: { id } });
    },
    listByDriver(driverId) {
        return prisma_1.prisma.trip.findMany({
            where: { driverId },
            include: { route: true, bus: true },
            orderBy: { departureTime: "asc" },
        });
    },
    async seats(tripId) {
        const trip = await prisma_1.prisma.trip.findUnique({
            where: { id: tripId },
            include: { bus: true },
        });
        if (!trip)
            throw new Error("Trip not found");
        const seatRows = await prisma_1.prisma.reservationSeat.findMany({
            where: { tripId, reservation: { status: "CONFIRMED" } },
            select: { seatNumber: true },
        });
        const occupied = new Set(seatRows.map((s) => s.seatNumber));
        const seats = [];
        for (let i = 1; i <= trip.bus.capacity; i++) {
            seats.push({ seatNumber: i, status: occupied.has(i) ? "OCCUPIED" : "AVAILABLE" });
        }
        return seats;
    },
};
