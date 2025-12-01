"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripController = void 0;
const trip_service_1 = require("./trip.service");
const audit_1 = require("../../utils/audit");
const parseDate = (value) => (value ? new Date(value) : undefined);
exports.TripController = {
    search: async (req, res) => {
        const trips = await trip_service_1.TripService.search({
            origin: req.query.origin,
            destination: req.query.destination,
            date: req.query.date,
        });
        return res.json(trips);
    },
    get: async (req, res) => {
        const trip = await trip_service_1.TripService.getById(req.params.id);
        if (!trip)
            return res.status(404).json({ message: "Trip not found" });
        return res.json(trip);
    },
    create: async (req, res) => {
        try {
            const trip = await trip_service_1.TripService.create({
                ...req.body,
                departureTime: parseDate(req.body.departureTime) ?? new Date(),
                arrivalTime: parseDate(req.body.arrivalTime) ?? null,
            });
            await (0, audit_1.logAction)(req, { tableName: "trip", action: "create", entityId: trip.id });
            return res.status(201).json(trip);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to create trip" });
        }
    },
    update: async (req, res) => {
        try {
            const trip = await trip_service_1.TripService.update(req.params.id, {
                ...req.body,
                departureTime: parseDate(req.body.departureTime),
                arrivalTime: parseDate(req.body.arrivalTime),
            });
            await (0, audit_1.logAction)(req, { tableName: "trip", action: "update", entityId: trip.id });
            return res.json(trip);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to update trip" });
        }
    },
    updateStatus: async (req, res) => {
        try {
            const trip = await trip_service_1.TripService.updateStatus(req.params.id, req.body.status);
            await (0, audit_1.logAction)(req, { tableName: "trip", action: "status", entityId: trip.id, description: req.body.status });
            return res.json(trip);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to update status" });
        }
    },
    byDriver: async (req, res) => {
        const trips = await trip_service_1.TripService.listByDriver(req.params.driverId);
        return res.json(trips);
    },
    seats: async (req, res) => {
        try {
            const seats = await trip_service_1.TripService.seats(req.params.id);
            return res.json(seats);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to load seats" });
        }
    },
    remove: async (req, res) => {
        try {
            const trip = await trip_service_1.TripService.remove(req.params.id);
            await (0, audit_1.logAction)(req, { tableName: "trip", action: "delete", entityId: trip.id });
            return res.json(trip);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to delete trip" });
        }
    },
};
