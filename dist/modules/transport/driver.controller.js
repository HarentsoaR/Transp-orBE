"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverController = void 0;
const driver_service_1 = require("./driver.service");
exports.DriverController = {
    list: async (_req, res) => {
        const drivers = await driver_service_1.DriverService.list();
        return res.json(drivers);
    },
    create: async (req, res) => {
        try {
            const driver = await driver_service_1.DriverService.create(req.body);
            return res.status(201).json(driver);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to create driver" });
        }
    },
    update: async (req, res) => {
        try {
            const driver = await driver_service_1.DriverService.update(req.params.id, req.body);
            return res.json(driver);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to update driver" });
        }
    },
    remove: async (req, res) => {
        try {
            const driver = await driver_service_1.DriverService.remove(req.params.id);
            return res.json(driver);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to delete driver" });
        }
    },
};
