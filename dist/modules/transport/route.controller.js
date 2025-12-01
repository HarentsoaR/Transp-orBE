"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteController = void 0;
const route_service_1 = require("./route.service");
const audit_1 = require("../../utils/audit");
exports.RouteController = {
    list: async (_req, res) => {
        const routes = await route_service_1.RouteService.list();
        return res.json(routes);
    },
    get: async (req, res) => {
        const route = await route_service_1.RouteService.get(req.params.id);
        if (!route)
            return res.status(404).json({ message: "Route not found" });
        return res.json(route);
    },
    create: async (req, res) => {
        try {
            const route = await route_service_1.RouteService.create(req.body);
            await (0, audit_1.logAction)(req, { tableName: "route", action: "create", entityId: route.id });
            return res.status(201).json(route);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to create route" });
        }
    },
    update: async (req, res) => {
        try {
            const route = await route_service_1.RouteService.update(req.params.id, req.body);
            await (0, audit_1.logAction)(req, { tableName: "route", action: "update", entityId: route.id });
            return res.json(route);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to update route" });
        }
    },
    remove: async (req, res) => {
        try {
            const route = await route_service_1.RouteService.remove(req.params.id);
            await (0, audit_1.logAction)(req, { tableName: "route", action: "delete", entityId: route.id });
            return res.json(route);
        }
        catch (error) {
            return res.status(400).json({ message: error.message ?? "Unable to delete route" });
        }
    },
};
