"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
exports.AuthController = {
    registerTraveler: async (req, res) => {
        try {
            const result = await auth_service_1.AuthService.registerTraveler(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to register traveler" });
        }
    },
    login: async (req, res) => {
        try {
            const result = await auth_service_1.AuthService.login({
                ...req.body,
                ip: req.ip,
                userAgent: req.get("user-agent") ?? undefined,
            });
            return res.json(result);
        }
        catch (error) {
            return res.status(401).json({ message: error.message ?? "Unable to login" });
        }
    },
};
