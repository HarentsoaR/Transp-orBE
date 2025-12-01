"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelerController = void 0;
const traveler_service_1 = require("./traveler.service");
exports.TravelerController = {
    list: async (_req, res) => {
        const travelers = await traveler_service_1.TravelerService.list();
        return res.json(travelers);
    },
    create: async (req, res) => {
        try {
            const traveler = await traveler_service_1.TravelerService.create(req.body);
            return res.status(201).json(traveler);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to create traveler" });
        }
    },
    update: async (req, res) => {
        try {
            const traveler = await traveler_service_1.TravelerService.update(req.params.id, req.body);
            return res.json(traveler);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to update traveler" });
        }
    },
    remove: async (req, res) => {
        try {
            const traveler = await traveler_service_1.TravelerService.remove(req.params.id);
            return res.json(traveler);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to delete traveler" });
        }
    },
};
