import { Request, Response } from "express";
import { DriverService } from "./driver.service";
import { logAction } from "../../utils/audit";
import { parseListParams } from "../../utils/list";

export const DriverController = {
  list: async (req: Request, res: Response) => {
    const params = parseListParams(req.query);
    const drivers = await DriverService.list(params);
    return res.json(drivers);
  },

  create: async (req: Request, res: Response) => {
    try {
      const licenseExpiry =
        req.body.licenseExpiry === null
          ? null
          : req.body.licenseExpiry
            ? new Date(req.body.licenseExpiry)
            : undefined;
      const driver = await DriverService.create({
        ...req.body,
        licenseExpiry,
      });
      await logAction(req, { tableName: "driver", action: "create", entityId: driver.id });
      return res.status(201).json(driver);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Unable to create driver",
        code: "DRIVER_CREATE_FAILED",
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const licenseExpiry =
        req.body.licenseExpiry === null
          ? null
          : req.body.licenseExpiry
            ? new Date(req.body.licenseExpiry)
            : undefined;
      const driver = await DriverService.update(req.params.id, {
        ...req.body,
        licenseExpiry,
      });
      await logAction(req, { tableName: "driver", action: "update", entityId: driver.id });
      return res.json(driver);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Unable to update driver",
        code: "DRIVER_UPDATE_FAILED",
      });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const driver = await DriverService.remove(req.params.id);
      await logAction(req, { tableName: "driver", action: "delete", entityId: driver.id });
      return res.json(driver);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Unable to delete driver",
        code: "DRIVER_DELETE_FAILED",
      });
    }
  },
};
