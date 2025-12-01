import { Request, Response } from "express";
import { RouteService } from "./route.service";
import { logAction } from "../../utils/audit";

export const RouteController = {
  list: async (_req: Request, res: Response) => {
    const routes = await RouteService.list();
    return res.json(routes);
  },

  get: async (req: Request, res: Response) => {
    const route = await RouteService.get(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    return res.json(route);
  },

  create: async (req: Request, res: Response) => {
    try {
      const route = await RouteService.create(req.body);
      await logAction(req, { tableName: "route", action: "create", entityId: route.id });
      return res.status(201).json(route);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to create route" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const route = await RouteService.update(req.params.id, req.body);
      await logAction(req, { tableName: "route", action: "update", entityId: route.id });
      return res.json(route);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to update route" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const route = await RouteService.remove(req.params.id);
      await logAction(req, { tableName: "route", action: "delete", entityId: route.id });
      return res.json(route);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to delete route" });
    }
  },
};
