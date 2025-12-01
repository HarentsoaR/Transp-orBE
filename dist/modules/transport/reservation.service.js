"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
exports.ReservationService = {
    async create(input, userId) {
        const seatNumbers = (input.seatNumbers?.length ? input.seatNumbers : input.seatNumber ? [input.seatNumber] : [])
            .filter((s) => !!s)
            .map((s) => Number(s));
        const uniqueSeats = Array.from(new Set(seatNumbers));
        if (uniqueSeats.length === 0) {
            throw new Error("Au moins un siège est requis");
        }
        if (uniqueSeats.length !== seatNumbers.length) {
            throw new Error("Doublon dans les numéros de sièges");
        }
        const trip = await prisma_1.prisma.trip.findUnique({
            where: { id: input.tripId },
            include: { bus: true },
        });
        if (!trip)
            throw new Error("Trip not found");
        if (trip.availableSeats < uniqueSeats.length)
            throw new Error("Pas assez de places disponibles");
        const overCapacitySeat = uniqueSeats.find((s) => s > trip.bus.capacity);
        if (overCapacitySeat)
            throw new Error(`Seat ${overCapacitySeat} exceeds bus capacity`);
        const price = input.price ?? Number(trip.price);
        return prisma_1.prisma.$transaction(async (tx) => {
            const seatsAlreadyTaken = await tx.reservationSeat.findMany({
                where: {
                    tripId: input.tripId,
                    seatNumber: { in: uniqueSeats },
                    reservation: { status: client_1.ReservationStatus.CONFIRMED },
                },
                select: { seatNumber: true },
            });
            if (seatsAlreadyTaken.length) {
                const seatList = seatsAlreadyTaken.map((s) => s.seatNumber).join(", ");
                throw new Error(`Siège(s) déjà réservé(s): ${seatList}`);
            }
            let baseTravelerId = input.travelerId;
            if (!baseTravelerId && userId) {
                const traveler = await tx.traveler.findFirst({ where: { userId } });
                if (traveler) {
                    baseTravelerId = traveler.id;
                }
                else {
                    const user = await tx.user.findUnique({ where: { id: userId } });
                    if (user) {
                        const newTraveler = await tx.traveler.create({
                            data: {
                                userId,
                                fullName: `${user.firstName} ${user.lastName}`,
                                phone: user.phone ?? "",
                                email: user.email,
                            },
                        });
                        baseTravelerId = newTraveler.id;
                    }
                }
            }
            const travelerInfo = input.travelerInfo;
            if (travelerInfo) {
                if (baseTravelerId) {
                    await tx.traveler.update({
                        where: { id: baseTravelerId },
                        data: {
                            fullName: travelerInfo.fullName,
                            phone: travelerInfo.phone,
                            nationalId: travelerInfo.nationalId,
                            emergencyContactName: travelerInfo.emergencyContactName,
                            emergencyContactPhone: travelerInfo.emergencyContactPhone,
                            profession: travelerInfo.profession,
                        },
                    });
                }
                else {
                    const travelerRecord = await tx.traveler.create({
                        data: {
                            fullName: travelerInfo.fullName,
                            phone: travelerInfo.phone,
                            nationalId: travelerInfo.nationalId,
                            emergencyContactName: travelerInfo.emergencyContactName,
                            emergencyContactPhone: travelerInfo.emergencyContactPhone,
                            profession: travelerInfo.profession,
                        },
                    });
                    baseTravelerId = travelerRecord.id;
                }
            }
            if (!baseTravelerId) {
                throw new Error("Traveler not provided");
            }
            const reservation = await tx.reservation.create({
                data: {
                    tripId: input.tripId,
                    travelerId: baseTravelerId,
                    price,
                    seatNumber: uniqueSeats[0],
                    passengerName: travelerInfo?.fullName,
                    passengerPhone: travelerInfo?.phone,
                    passengerNationalId: travelerInfo?.nationalId,
                    emergencyContactName: travelerInfo?.emergencyContactName,
                    emergencyContactPhone: travelerInfo?.emergencyContactPhone,
                    travelerProfession: travelerInfo?.profession,
                    seats: {
                        create: uniqueSeats.map((seat) => ({
                            seatNumber: seat,
                            tripId: input.tripId,
                        })),
                    },
                },
                include: {
                    traveler: true,
                    seats: true,
                    trip: { include: { route: true, bus: true } },
                },
            });
            await tx.trip.update({
                where: { id: input.tripId },
                data: { availableSeats: { decrement: uniqueSeats.length } },
            });
            return reservation;
        });
    },
    async cancel(reservationId, actorId) {
        const reservation = await prisma_1.prisma.reservation.findUnique({ where: { id: reservationId } });
        if (!reservation)
            throw new Error("Reservation not found");
        if (reservation.status === client_1.ReservationStatus.CANCELLED)
            return reservation;
        const seatCount = await prisma_1.prisma.reservationSeat.count({ where: { reservationId } }).then((c) => (c > 0 ? c : 1));
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            const res = await tx.reservation.update({
                where: { id: reservationId },
                data: { status: client_1.ReservationStatus.CANCELLED },
            });
            await tx.reservationSeat.deleteMany({ where: { reservationId } });
            await tx.trip.update({
                where: { id: reservation.tripId },
                data: { availableSeats: { increment: seatCount } },
            });
            if (actorId) {
                await tx.auditLog.create({
                    data: {
                        actorId,
                        action: "reservation_cancelled",
                        entity: "reservation",
                        entityId: reservationId,
                    },
                });
            }
            return res;
        });
        return updated;
    },
    listForTraveler(userId) {
        return prisma_1.prisma.reservation.findMany({
            where: { traveler: { userId } },
            include: { trip: { include: { route: true, bus: true } } },
            orderBy: { createdAt: "desc" },
        });
    },
    async checkIn(reservationId) {
        return prisma_1.prisma.reservation.update({
            where: { id: reservationId },
            data: { checkIn: "BOARDED" },
        });
    },
    occupancy(tripId) {
        return prisma_1.prisma.reservation.groupBy({
            by: ["status"],
            where: { tripId },
            _count: { _all: true },
        });
    },
};
