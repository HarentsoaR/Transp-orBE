import { Request, Response } from "express";
import { DriverService } from "./driver.service";
import { logAction } from "../../utils/audit";

export const DriverController = {
  list: async (_req: Request, res: Response) => {
    const drivers = await DriverService.list();
    return res.json(drivers);
  },

  create: async (req: Request, res: Response) => {
    try {
      const driver = await DriverService.create(req.body);
      await logAction(req, { tableName: "driver", action: "create", entityId: driver.id });
      return res.status(201).json(driver);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to create driver" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const driver = await DriverService.update(req.params.id, req.body);
      await logAction(req, { tableName: "driver", action: "update", entityId: driver.id });
      return res.json(driver);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to update driver" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const driver = await DriverService.remove(req.params.id);
      await logAction(req, { tableName: "driver", action: "delete", entityId: driver.id });
      return res.json(driver);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to delete driver" });
    }
  },
};
