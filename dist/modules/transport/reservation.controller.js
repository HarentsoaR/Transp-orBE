"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationController = void 0;
const reservation_service_1 = require("./reservation.service");
const audit_1 = require("../../utils/audit");
exports.ReservationController = {
    create: async (req, res) => {
        try {
            const reservation = await reservation_service_1.ReservationService.create(req.body, req.user?.id);
            await (0, audit_1.logAction)(req, { tableName: "reservation", action: "create", entityId: reservation?.id });
            return res.status(201).json(reservation);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to create reservation" });
        }
    },
    myReservations: async (req, res) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const reservations = await reservation_service_1.ReservationService.listForTraveler(req.user.id);
        return res.json(reservations);
    },
    cancel: async (req, res) => {
        try {
            const reservation = await reservation_service_1.ReservationService.cancel(req.params.id, req.user?.id);
            await (0, audit_1.logAction)(req, { tableName: "reservation", action: "cancel", entityId: reservation.id });
            return res.json(reservation);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to cancel reservation" });
        }
    },
    checkIn: async (req, res) => {
        try {
            const reservation = await reservation_service_1.ReservationService.checkIn(req.params.id);
            await (0, audit_1.logAction)(req, { tableName: "reservation", action: "checkin", entityId: reservation.id });
            return res.json(reservation);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to check in reservation" });
        }
    },
    occupancy: async (req, res) => {
        const data = await reservation_service_1.ReservationService.occupancy(req.params.tripId);
        return res.json(data);
    },
};
