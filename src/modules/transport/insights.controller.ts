import { Request, Response } from "express";
import { InsightsService } from "./insights.service";

const allowedEntities = ["drivers", "vehicles", "travelers"] as const;

type Entity = (typeof allowedEntities)[number];

export const InsightsController = {
  get: async (req: Request, res: Response) => {
    const entity = req.query.entity as Entity | undefined;
    if (!entity || !allowedEntities.includes(entity)) {
      return res.status(400).json({ message: "Invalid entity", code: "INSIGHTS_ENTITY_INVALID" });
    }
    try {
      const data = await InsightsService.get(entity);
      return res.json(data);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message ?? "Unable to load insights", code: "INSIGHTS_FAILED" });
    }
  },
};
