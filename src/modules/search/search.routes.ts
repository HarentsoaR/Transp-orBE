import { Router } from "express";
import { z } from "zod";
import { SearchService } from "./search.service";
import { validateBody } from "../../middleware/validate";
import { requirePermissions } from "../../middleware/permissions";

export const searchRouter = Router();

const reindexSchema = z.object({
  index: z.string().optional(),
});

searchRouter.get("/", async (req, res) => {
  if (!SearchService.isEnabled) return res.status(503).json({ message: "Search not configured" });
  const q = (req.query.q as string) ?? "*";
  try {
    const results = await SearchService.search(q, (req.query.index as string) ?? undefined);
    return res.json(results);
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Search failed" });
  }
});

searchRouter.post(
  "/reindex",
  requirePermissions(["search.manage"]),
  validateBody(reindexSchema),
  async (req, res) => {
    if (!SearchService.isEnabled) return res.status(503).json({ message: "Search not configured" });
    try {
      const result = await SearchService.reindex(req.body.index);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Reindex failed" });
    }
  }
);
