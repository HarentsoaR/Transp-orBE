import { Request, Response } from "express";
import { BusService } from "./bus.service";
import { logAction } from "../../utils/audit";
import { parseListParams } from "../../utils/list";

export const BusController = {
  list: async (req: Request, res: Response) => {
    const params = parseListParams(req.query);
    const buses = await BusService.list(params);
    return res.json(buses);
  },

  create: async (req: Request, res: Response) => {
    try {
      const nextMaintenanceAt =
        req.body.nextMaintenanceAt === null
          ? null
          : req.body.nextMaintenanceAt
            ? new Date(req.body.nextMaintenanceAt)
            : undefined;
      const insuranceExpiry =
        req.body.insuranceExpiry === null
          ? null
          : req.body.insuranceExpiry
            ? new Date(req.body.insuranceExpiry)
            : undefined;
      const bus = await BusService.create({
        ...req.body,
        nextMaintenanceAt,
        insuranceExpiry,
      });
      await logAction(req, { tableName: "bus", action: "create", entityId: bus.id });
      return res.status(201).json(bus);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Unable to create bus",
        code: "BUS_CREATE_FAILED",
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const nextMaintenanceAt =
        req.body.nextMaintenanceAt === null
          ? null
          : req.body.nextMaintenanceAt
            ? new Date(req.body.nextMaintenanceAt)
            : undefined;
      const insuranceExpiry =
        req.body.insuranceExpiry === null
          ? null
          : req.body.insuranceExpiry
            ? new Date(req.body.insuranceExpiry)
            : undefined;
      const bus = await BusService.update(req.params.id, {
        ...req.body,
        nextMaintenanceAt,
        insuranceExpiry,
      });
      await logAction(req, { tableName: "bus", action: "update", entityId: bus.id });
      return res.json(bus);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Unable to update bus",
        code: "BUS_UPDATE_FAILED",
      });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const bus = await BusService.remove(req.params.id);
      await logAction(req, { tableName: "bus", action: "delete", entityId: bus.id });
      return res.json(bus);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Unable to delete bus",
        code: "BUS_DELETE_FAILED",
      });
    }
  },
};
