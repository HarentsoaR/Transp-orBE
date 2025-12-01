import { Request, Response } from "express";
import { BusService } from "./bus.service";

export const BusController = {
  list: async (_req: Request, res: Response) => {
    const buses = await BusService.list();
    return res.json(buses);
  },

  create: async (req: Request, res: Response) => {
    try {
      const bus = await BusService.create(req.body);
      return res.status(201).json(bus);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to create bus" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const bus = await BusService.update(req.params.id, req.body);
      return res.json(bus);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to update bus" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const bus = await BusService.remove(req.params.id);
      return res.json(bus);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to delete bus" });
    }
  },
};
