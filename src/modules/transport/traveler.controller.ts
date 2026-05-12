import { Request, Response } from "express";
import { TravelerService } from "./traveler.service";
import { logAction } from "../../utils/audit";
import { parseListParams } from "../../utils/list";

export const TravelerController = {
  list: async (req: Request, res: Response) => {
    const params = parseListParams(req.query);
    const travelers = await TravelerService.list(params);
    return res.json(travelers);
  },

  create: async (req: Request, res: Response) => {
    try {
      const traveler = await TravelerService.create(req.body);
      await logAction(req, { tableName: "traveler", action: "create", entityId: traveler.id });
      return res.status(201).json(traveler);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Unable to create traveler",
        code: "TRAVELER_CREATE_FAILED",
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const traveler = await TravelerService.update(req.params.id, req.body);
      await logAction(req, { tableName: "traveler", action: "update", entityId: traveler.id });
      return res.json(traveler);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Unable to update traveler",
        code: "TRAVELER_UPDATE_FAILED",
      });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const traveler = await TravelerService.remove(req.params.id);
      await logAction(req, { tableName: "traveler", action: "delete", entityId: traveler.id });
      return res.json(traveler);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Unable to delete traveler",
        code: "TRAVELER_DELETE_FAILED",
      });
    }
  },
};
