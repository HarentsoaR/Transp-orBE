import { Request, Response } from "express";
import { TravelerService } from "./traveler.service";

export const TravelerController = {
  list: async (_req: Request, res: Response) => {
    const travelers = await TravelerService.list();
    return res.json(travelers);
  },

  create: async (req: Request, res: Response) => {
    try {
      const traveler = await TravelerService.create(req.body);
      return res.status(201).json(traveler);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to create traveler" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const traveler = await TravelerService.update(req.params.id, req.body);
      return res.json(traveler);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to update traveler" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const traveler = await TravelerService.remove(req.params.id);
      return res.json(traveler);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to delete traveler" });
    }
  },
};
