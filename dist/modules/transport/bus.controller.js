"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusController = void 0;
const bus_service_1 = require("./bus.service");
exports.BusController = {
    list: async (_req, res) => {
        const buses = await bus_service_1.BusService.list();
        return res.json(buses);
    },
    create: async (req, res) => {
        try {
            const bus = await bus_service_1.BusService.create(req.body);
            return res.status(201).json(bus);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to create bus" });
        }
    },
    update: async (req, res) => {
        try {
            const bus = await bus_service_1.BusService.update(req.params.id, req.body);
            return res.json(bus);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to update bus" });
        }
    },
    remove: async (req, res) => {
        try {
            const bus = await bus_service_1.BusService.remove(req.params.id);
            return res.json(bus);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to delete bus" });
        }
    },
};
