import { Request, Response } from "express";
import { RouteService } from "./route.service";

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
      return res.status(201).json(route);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to create route" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const route = await RouteService.update(req.params.id, req.body);
      return res.json(route);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to update route" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const route = await RouteService.remove(req.params.id);
      return res.json(route);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to delete route" });
    }
  },
};
